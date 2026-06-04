# ColdStamp

A Chrome extension that does two complementary jobs at checkout:

1. **Preventative (before you click):** scans the page for dark patterns —
   pre-ticked recurring add-ons, trial-to-paid conversions, buried recurring
   prices, mismatched totals, confirmshaming — and shows a small panel.
2. **Forensic (when you click):** snapshots the consent context, redacts PII,
   canonicalises, SHA-256 hashes, and stores it locally as a sealed evidence
   bundle.

Everything runs on-device. Nothing leaves your browser today.

## Run the demo

```bash
npm install
npm run build       # builds the extension to dist/
npm run fixture     # serves the fake checkout at http://localhost:5174
```

1. Open `chrome://extensions`, enable Developer Mode, **Load unpacked** → `dist/`.
2. Visit `http://localhost:5174`. The preventative panel should appear in the
   top-right within ~250ms, listing five findings:
   - **A recurring charge is pre-ticked** (high)
   - **The total is more than the items add up to** (high)
   - **Free now, then a real charge** (medium)
   - **The recurring price is hidden in the fine print** (medium)
   - **Guilt-trip decline button** (low)
3. Fill the form (test data: card `4242 4242 4242 4242`, cvv `123`).
4. Click **Start free trial**. You should see `[ColdStamp] captured bundle …`
   in the DevTools console.
5. Click the extension icon → **Export** a bundle → verify:
   - card / cvv values are `[REDACTED]`
   - `networkCharges[0]` shows `amount: 1999`, `recurring: true`, `intervalText: "month"`
   - the raw body is not stored — only `rawBodyDigest`

## Architecture

```
src/
  manifest.json              MV3
  background.ts              service worker — viewport screenshot via captureVisibleTab
  content/
    page-world.ts            MAIN-world: patches window.fetch + XMLHttpRequest
    index.ts                 isolated-world orchestrator: detection scan + sealed capture
    detectors.ts             5 deterministic dark-pattern detectors
    panel.ts                 Shadow-DOM warning panel (non-blocking)
  dashboard/
    index.html, main.ts      popup: list / export / delete
  lib/
    types.ts                 EvidenceBundle shape
    seal.ts                  canonical JSON + SHA-256
    redact.ts                field-aware PII redaction
    db.ts                    IndexedDB vault
    lexicon.ts               word/phrase lists (shared by detection + disclosure capture)
    dom.ts                   label/price/contrast/visibility helpers
fixtures/
  fake-checkout/             triggers all 5 detectors + Stripe-shaped POST
```

### Design notes

- **Detection and capture are decoupled.** Findings are derived, not sealed.
  The bundle stays a neutral DOM snapshot so the classifier can be improved
  later and re-run over stored bundles. This is the project's spec §1
  principle and a deliberate choice over baking findings into the seal.
- **Precision over recall on detectors.** A single false positive costs more
  trust than a missed detection builds. Lexicons are conservative; detectors
  stop at the first solid hit.
- **Panel uses Shadow DOM**, not `!important` — clean isolation from site CSS.

## Privacy

- Bundles are stored in IndexedDB inside the extension's origin. Currently
  unencrypted at rest (planned for a later milestone).
- The MAIN-world fetch/XHR hook only stores a SHA-256 digest of payment
  request bodies, never the raw body.
- No backend, no telemetry, no analytics.

## What's NOT in here yet

- RFC 3161 timestamp anchor (M2)
- At-rest encryption of the IndexedDB store
- Onboarding / consent UI / 18+ gate / privacy policy (M4)
- Encrypted cloud backup (M5)
- Per-site adapters for known offenders
- Pre-submit interstitial on `high`-severity findings (kept inline-only for now)
