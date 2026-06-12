import { deleteAll, deleteBundle, listBundles } from "../lib/db";
import type { EvidenceBundle } from "../lib/types";
import { getConsent, hasCapture, PRIVACY_POLICY_URL } from "../lib/consent";

const fmtTime = (t: number) =>
  new Date(t).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

function flaggedCount(b: EvidenceBundle): number {
  return b.controlState.filter(
    (c) =>
      (c.type === "checkbox" || c.type === "radio") &&
      c.defaultChecked &&
      !c.userInteracted
  ).length;
}

function renderBundles(bundles: EvidenceBundle[]) {
  const list = document.getElementById("list")!;
  list.textContent = "";

  if (bundles.length === 0) {
    const div = document.createElement("div");
    div.className = "empty";
    div.innerHTML = `
      <p>No bundles captured yet.</p>
      <p class="hint">Visit a checkout page and click a subscribe / pay button.</p>
    `;
    list.appendChild(div);
    return;
  }

  for (const b of bundles) {
    const row = document.createElement("div");
    row.className = "row";

    const domain = document.createElement("div");
    domain.className = "domain";
    domain.textContent = b.merchantDomain;
    row.appendChild(domain);

    const meta = document.createElement("div");
    meta.className = "meta";
    const flagged = flaggedCount(b);
    const charges = b.networkCharges.length;
    const flaggedPill =
      flagged > 0
        ? `<span class="pill warn">${flagged} pre-checked</span>`
        : `<span class="pill">no pre-checked</span>`;
    const chargesPill = `<span class="pill">${charges} payment req${charges === 1 ? "" : "s"}</span>`;
    meta.innerHTML = `${fmtTime(b.capturedAt)} · ${flaggedPill}${chargesPill}`;
    row.appendChild(meta);

    if (b.merchantAccountHint) {
      const hint = document.createElement("div");
      hint.className = "hint";
      hint.textContent = `account: ${b.merchantAccountHint}`;
      row.appendChild(hint);
    }

    const hash = document.createElement("div");
    hash.className = "hash";
    hash.textContent = `sha256:${b.rootHash}`;
    row.appendChild(hash);

    const actions = document.createElement("div");
    actions.className = "actions";

    const exportBtn = document.createElement("button");
    exportBtn.textContent = "Export";
    exportBtn.onclick = () => {
      const blob = new Blob([JSON.stringify(b, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `coldstamp-bundle-${b.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    };
    actions.appendChild(exportBtn);

    const delBtn = document.createElement("button");
    delBtn.className = "danger";
    delBtn.textContent = "Delete";
    delBtn.onclick = async () => {
      await deleteBundle(b.id);
      void refresh();
    };
    actions.appendChild(delBtn);

    row.appendChild(actions);
    list.appendChild(row);
  }
}

async function refreshStatus() {
  const statusEl = document.getElementById("status")!;
  const consent = await getConsent();
  const on = hasCapture(consent);
  statusEl.hidden = false;
  statusEl.classList.toggle("on", on);
  statusEl.classList.toggle("off", !on);
  statusEl.textContent = on ? "Capture on" : "Capture off";
}

async function refresh() {
  await refreshStatus();
  renderBundles(await listBundles());
}

document.getElementById("delete-all")!.addEventListener("click", async () => {
  if (!confirm("Delete all captured bundles?")) return;
  await deleteAll();
  void refresh();
});

document.getElementById("open-settings")!.addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("src/onboarding/index.html") });
  window.close();
});

const howLink = document.getElementById("how-it-works") as HTMLAnchorElement;
howLink.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: chrome.runtime.getURL("src/about/index.html") });
  window.close();
});

const privacyLink = document.getElementById("privacy") as HTMLAnchorElement;
privacyLink.href = PRIVACY_POLICY_URL;
privacyLink.target = "_blank";
privacyLink.rel = "noopener";

document.getElementById("version")!.textContent = chrome.runtime.getManifest().version;

void refresh();
