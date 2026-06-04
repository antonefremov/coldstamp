import type {
  ControlSnapshot,
  DisclosureVisibility,
  EvidenceBundle,
  InteractionEvent,
  NetworkCharge,
} from "../lib/types";
import { isSensitiveField, redactValue, redactBodySnippet, redactFreeText } from "../lib/redact";
import { rootHash, sha256Hex } from "../lib/seal";
import { putBundle } from "../lib/db";
import { isCheckoutLikePage, runDetectors } from "./detectors";
import { render as renderPanel, unmount as unmountPanel } from "./panel";
import { labelFor } from "../lib/dom";

// page-world fetch/XHR hook is loaded as a separate content_script with
// "world": "MAIN" — see manifest.json. It posts payment-ish requests via
// window.postMessage with __si: "__SI_NET__".

// ---- shared capture state ----------------------------------------------------
const interactedEls = new WeakSet<Element>();
const interactionLog: InteractionEvent[] = [];
const networkCharges: NetworkCharge[] = [];

const elSelector = (el: Element): string => {
  if (!el || el === document.documentElement) return "html";
  const id = (el as HTMLElement).id;
  if (id) return `#${id}`;
  const name = (el as HTMLInputElement).name;
  const tag = el.tagName.toLowerCase();
  return name ? `${tag}[name="${name}"]` : tag;
};

const pushInteraction = (kind: InteractionEvent["kind"], target: Element | null) => {
  interactionLog.push({
    t: Date.now(),
    kind,
    target: target ? elSelector(target) : "window",
  });
  if (interactionLog.length > 500) interactionLog.shift();
};

document.addEventListener("click", (e) => {
  const t = e.target as Element | null;
  if (t) interactedEls.add(t);
  pushInteraction("click", t);
}, true);
document.addEventListener("focusin", (e) => pushInteraction("focus", e.target as Element), true);
document.addEventListener("change", (e) => {
  const t = e.target as Element | null;
  if (t) interactedEls.add(t);
  pushInteraction("change", t);
}, true);
let scrollTick = 0;
document.addEventListener("scroll", () => {
  const now = Date.now();
  if (now - scrollTick < 250) return;
  scrollTick = now;
  pushInteraction("scroll", null);
}, true);

// ---- listen for payment-ish requests from page world ------------------------
window.addEventListener("message", (ev: MessageEvent) => {
  const data = ev.data;
  if (!data || data.__si !== "__SI_NET__") return;
  const p = data.payload;
  const body = String(p.body || "");
  const charge = extractChargeFromBody(body);
  sha256Hex(body).then((digest) => {
    networkCharges.push({
      t: p.t,
      url: p.url,
      method: p.method,
      amount: charge.amount,
      currency: charge.currency,
      recurring: charge.recurring,
      intervalText: charge.intervalText,
      rawBodyDigest: digest,
    });
  });
});

function extractChargeFromBody(body: string): {
  amount: number | null;
  currency: string | null;
  recurring: boolean | null;
  intervalText: string | null;
} {
  let amount: number | null = null;
  let currency: string | null = null;
  let recurring: boolean | null = null;
  let intervalText: string | null = null;

  // URL-encoded form (Stripe-shaped: amount=1999&currency=usd)
  const params = body.includes("=") && body.includes("&") ? new URLSearchParams(body) : null;
  if (params) {
    const a = params.get("amount");
    if (a && /^\d+$/.test(a)) amount = parseInt(a, 10);
    currency = params.get("currency");
    const interval = params.get("interval") || params.get("recurring[interval]");
    if (interval) {
      recurring = true;
      intervalText = interval;
    }
  }
  // JSON-shaped
  try {
    const j = JSON.parse(body);
    if (j && typeof j === "object") {
      if (amount == null && typeof j.amount === "number") amount = j.amount;
      if (!currency && typeof j.currency === "string") currency = j.currency;
      if (j.recurring || j.subscription) {
        recurring = true;
        intervalText = j.interval || j.recurring?.interval || intervalText;
      }
    }
  } catch {}
  return { amount, currency, recurring, intervalText };
}

// ---- checkout detection ------------------------------------------------------
const KEYWORDS = /\b(subscribe|subscription|trial|start[- ]?membership|recurring|auto[- ]?renew)\b/i;

function looksLikeCheckout(): boolean {
  // Payment input present?
  const ccField = document.querySelector(
    'input[autocomplete="cc-number"], input[name*="card" i], input[id*="card" i][type="text"], input[type="tel"][name*="card" i]'
  );
  if (ccField) return true;
  // Known payment SDK loaded?
  const scripts = Array.from(document.scripts).map((s) => s.src.toLowerCase());
  if (scripts.some((s) => /stripe|braintree|adyen|paypal|checkout\.com/.test(s))) return true;
  // Subscription keyword near a primary CTA?
  const buttons = Array.from(document.querySelectorAll('button, [role="button"], input[type="submit"]'));
  if (buttons.some((b) => KEYWORDS.test(b.textContent || (b as HTMLInputElement).value || ""))) return true;
  return false;
}

// ---- consent-moment snapshot -------------------------------------------------
function snapshotControls(): ControlSnapshot[] {
  const out: ControlSnapshot[] = [];
  const inputs = document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
    "input, select, textarea"
  );
  inputs.forEach((el) => {
    const tag = el.tagName.toLowerCase();
    const type = (el as HTMLInputElement).type || "";
    const name = (el as HTMLInputElement).name || "";
    const id = el.id || "";
    const autocomplete = el.getAttribute("autocomplete") || "";
    const sensitivity = isSensitiveField({ autocomplete, name, id, type });

    const labelText = redactFreeText(labelFor(el as HTMLElement).slice(0, 200));

    const checked = type === "checkbox" || type === "radio" ? (el as HTMLInputElement).checked : null;
    const defaultChecked =
      type === "checkbox" || type === "radio" ? (el as HTMLInputElement).defaultChecked : null;

    const rawValue = "value" in el ? String((el as HTMLInputElement).value ?? "") : "";
    const value = redactValue(rawValue, sensitivity);
    const defaultValue = redactValue(String((el as HTMLInputElement).defaultValue ?? ""), sensitivity);

    let rect: ControlSnapshot["rect"] = null;
    try {
      const r = (el as HTMLElement).getBoundingClientRect();
      rect = { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    } catch {}

    out.push({
      tag,
      type,
      name,
      id,
      autocomplete,
      labelText,
      checked,
      defaultChecked,
      value,
      defaultValue,
      userInteracted: interactedEls.has(el),
      rect,
    });
  });
  return out;
}

function disclosureVisibility(): DisclosureVisibility[] {
  const phrases = [
    "auto-renew",
    "automatically renew",
    "recurring",
    "per month",
    "/month",
    "per year",
    "/year",
    "cancel anytime",
    "after trial",
  ];
  const out: DisclosureVisibility[] = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const vh = window.innerHeight;
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const text = (node.nodeValue || "").trim();
    if (!text) continue;
    const low = text.toLowerCase();
    const matched = phrases.find((p) => low.includes(p));
    if (!matched) continue;
    const parent = node.parentElement;
    if (!parent) continue;
    const r = parent.getBoundingClientRect();
    out.push({
      query: matched,
      text: redactFreeText(text.slice(0, 240)),
      inViewportAtConsent: r.top < vh && r.bottom > 0,
    });
    if (out.length > 25) break;
  }
  return out;
}

async function requestScreenshot(): Promise<string | null> {
  try {
    const resp = await chrome.runtime.sendMessage({ kind: "captureScreenshot" });
    return resp?.dataUrl ?? null;
  } catch {
    return null;
  }
}

// ---- consent-moment trigger --------------------------------------------------
const CTA_RE = /\b(pay|subscribe|start|confirm|place order|continue)\b/i;

let lastCaptureAt = 0;
async function captureNow(reason: string) {
  if (!looksLikeCheckout()) return;
  const now = Date.now();
  if (now - lastCaptureAt < 2000) return;
  lastCaptureAt = now;
  const controlState = snapshotControls();
  const dv = disclosureVisibility();
  const screenshot = await requestScreenshot();

  const bundleSansHash = {
    schemaVersion: 1 as const,
    capturedAt: Date.now(),
    merchantDomain: location.host,
    pageUrl: location.href,
    pageTitle: document.title.slice(0, 200),
    controlState,
    interactionLog: interactionLog.slice(),
    networkCharges: networkCharges.slice(),
    disclosureVisibility: dv,
    screenshotDataUrl: screenshot,
    captureReason: reason,
  };
  const hash = await rootHash(bundleSansHash);
  const bundle: EvidenceBundle = {
    id: crypto.randomUUID(),
    ...bundleSansHash,
    rootHash: hash,
    anchor: null,
  };
  await putBundle(bundle);
  console.info("[SI] captured bundle", bundle.id, "root", hash);
}

document.addEventListener(
  "click",
  (e) => {
    const t = e.target as HTMLElement | null;
    if (!t) return;
    const btn = t.closest('button, [role="button"], input[type="submit"], a');
    if (!btn) return;
    const label = (btn.textContent || (btn as HTMLInputElement).value || "").trim();
    if (CTA_RE.test(label)) {
      // capture is async but we don't block the click
      void captureNow(`cta:${label.slice(0, 40)}`);
    }
  },
  true
);

document.addEventListener(
  "submit",
  () => {
    void captureNow("form:submit");
  },
  true
);

// ---- preventative layer: scan + panel ---------------------------------------
let scanScheduled = false;
function scheduleScan(delay = 250) {
  if (scanScheduled) return;
  scanScheduled = true;
  setTimeout(() => {
    scanScheduled = false;
    try {
      if (!isCheckoutLikePage()) {
        unmountPanel();
        return;
      }
      renderPanel(runDetectors());
    } catch (e) {
      console.debug("[ColdStamp] scan error", e);
    }
  }, delay);
}

function bootDetection() {
  scheduleScan(0);
  const mo = new MutationObserver(() => scheduleScan(250));
  mo.observe(document.documentElement, { childList: true, subtree: true, attributes: true, characterData: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootDetection, { once: true });
} else {
  bootDetection();
}
