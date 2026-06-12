// PII redaction. Conservative: scrub anything that looks like a card number, CVV,
// or email. Field-level redaction uses input type / autocomplete / name hints.

const CARD_RE = /\b(?:\d[ -]?){12,19}\b/g;
const CVV_RE = /\b\d{3,4}\b/g; // narrow; only apply to fields hinted as CVV
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/g;

const SENSITIVE_AUTOCOMPLETE = new Set([
  "cc-number",
  "cc-csc",
  "cc-exp",
  "cc-exp-month",
  "cc-exp-year",
  "cc-name",
]);

const SENSITIVE_NAME_HINT = /card|cvv|cvc|csc|cardnumber|securitycode/i;

export function isSensitiveField(opts: {
  autocomplete: string;
  name: string;
  id: string;
  type: string;
}): "card" | "cvv" | "email" | null {
  const ac = (opts.autocomplete || "").toLowerCase();
  if (ac === "cc-number") return "card";
  if (ac === "cc-csc") return "cvv";
  if (SENSITIVE_AUTOCOMPLETE.has(ac)) return "card";
  if (opts.type === "email" || ac === "email") return "email";
  const hint = `${opts.name} ${opts.id}`;
  if (SENSITIVE_NAME_HINT.test(hint)) return "card";
  return null;
}

export function redactValue(value: string, kind: "card" | "cvv" | "email" | null): string {
  if (!value) return value;
  if (kind === "card" || kind === "cvv") return "[REDACTED]";
  if (kind === "email") return "[REDACTED_EMAIL]";
  // Generic scrub as last resort
  return value
    .replace(CARD_RE, "[REDACTED_CARD]")
    .replace(EMAIL_RE, "[REDACTED_EMAIL]");
}

export function redactFreeText(text: string): string {
  return text.replace(CARD_RE, "[REDACTED_CARD]").replace(EMAIL_RE, "[REDACTED_EMAIL]");
}

// Turn "anton@gmail.com" into "an…@gmail.com" — enough to recognise your own
// account at the merchant later, not enough to be PII on its own. Returns null
// for inputs that don't look like an email at all.
export function hintFromEmail(raw: string): string | null {
  const trimmed = (raw || "").trim();
  const at = trimmed.indexOf("@");
  if (at < 1 || at === trimmed.length - 1) return null;
  const user = trimmed.slice(0, at);
  const domain = trimmed.slice(at);
  const visible = user.length <= 2 ? user.slice(0, 1) : user.slice(0, 2);
  return `${visible}…${domain}`;
}

export function redactBodySnippet(body: string): string {
  // For network bodies we don't keep the raw body — only a digest plus a
  // structurally-redacted preview. Defensive scrub anyway.
  return redactFreeText(body).replace(CVV_RE, (m) => (m.length === 3 ? "[REDACTED]" : m));
}
