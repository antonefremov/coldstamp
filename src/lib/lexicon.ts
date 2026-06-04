// Word/phrase lists used by detectors and by the capture-time disclosure scan.
// Conservative on purpose: precision over recall. A single false positive costs
// more trust than a missed detection builds.

export const lexicon = {
  // Language that implies a charge repeats on a schedule.
  recurrence: [
    "subscribe", "subscription", "recurring", "auto-renew", "auto renew",
    "automatically renew", "renews automatically", "renewal", "rebill",
    "rebilled", "billed monthly", "billed annually", "billed every",
    "per month", "per year", "/mo", "/month", "/yr", "/year", "a month",
    "a year", "monthly", "annually", "yearly", "membership", "vip",
    "keep me enrolled", "save my card", "store my card", "until cancelled",
    "until you cancel", "ongoing",
  ],

  // CTA language that starts a trial.
  trialCta: [
    "start free", "try free", "free trial", "start my free", "try it free",
    "start your free", "begin free", "free for", "0 today", "$0 today",
    "try for free", "start trial",
  ],

  // Language that signals a trial converts into a paid plan.
  conversion: [
    "then", "after that", "after your", "after the trial", "afterwards",
    "auto-renew", "automatically", "will be charged", "you'll be charged",
    "you will be charged", "renews at", "then just", "thereafter",
    "once the trial ends", "when your trial ends", "at the end of",
    "converts to",
  ],

  // Sneaky add-ons that frequently appear pre-ticked.
  addon: [
    "protection", "insurance", "warranty", "donation", "round up",
    "priority", "express", "expedited", "membership", "plus plan",
    "premium support", "gift wrap", "newsletter", "marketing", "offers",
    "third parties", "third-party", "processing fee", "service fee",
    "handling fee", "tip", "gratuity",
  ],

  // Guilt / shaming copy on the decline path (confirmshaming).
  confirmshame: [
    "no thanks, i", "no, i don't want", "no i don't want",
    "i don't want to save", "i'd rather pay", "i prefer to pay full",
    "i don't care about", "i'll risk it", "no, i like paying",
    "i don't want to protect", "maybe later", "i hate", "no, i'll miss out",
  ],

  // Disclosure phrases scanned at capture time for `disclosureVisibility`.
  disclosure: [
    "auto-renew", "automatically renew", "renews automatically", "recurring",
    "per month", "/month", "per year", "/year", "cancel anytime",
    "after trial", "after the trial", "then just", "until cancelled",
  ],

  // CTA labels that trigger capture.
  ctaLabel: [
    "pay", "subscribe", "start", "confirm", "place order", "continue",
    "join", "upgrade", "complete order", "complete purchase",
  ],
} as const;

export function containsAny(haystack: string, phrases: readonly string[]): string | null {
  if (!haystack) return null;
  const low = haystack.toLowerCase();
  for (const p of phrases) {
    if (low.includes(p)) return p;
  }
  return null;
}
