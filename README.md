# ColdStamp

[![CI](https://github.com/antonefremov/coldstamp/actions/workflows/ci.yml/badge.svg)](https://github.com/antonefremov/coldstamp/actions/workflows/ci.yml)
[![Secret scan](https://github.com/antonefremov/coldstamp/actions/workflows/secret-scan.yml/badge.svg)](https://github.com/antonefremov/coldstamp/actions/workflows/secret-scan.yml)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](./LICENSE)

A Chrome extension that does two complementary jobs at checkout:

1. **Preventative (before you click):** scans the page for dark patterns —
   pre-ticked recurring add-ons, trial-to-paid conversions, buried recurring
   prices, mismatched totals, confirmshaming — and shows a small panel.
2. **Forensic (when you click):** snapshots the consent context, redacts PII,
   canonicalises, SHA-256 hashes, and stores it locally as a sealed evidence
   bundle.

Everything runs on-device. Nothing leaves your browser today.

## Reproducible build

The build is deterministic from a clean checkout — anyone can verify that the
`dist/` produced from this source matches the `.crx` distributed via the Chrome
Web Store, byte-for-byte (excluding signing metadata Chrome attaches at upload).

Prerequisites:

- Node `24.16.0` (pinned via `.nvmrc` and `package.json#engines`)
- `npm` (bundled with Node)

```bash
nvm use            # or fnm use — picks up .nvmrc
npm ci             # installs the exact tree from package-lock.json
npm run build      # outputs dist/
npm run verify     # prints a single SHA-256 over the whole dist/ tree
```

`npm run verify` prints one hex string covering every file in `dist/`. Compare
it against the SHA-256 published in each GitHub release (added by CI). If they
match, the extension distributed via the Chrome Web Store was built from this
exact source. If they don't, please open an issue.

To inspect individual files instead of the rolled-up tree hash:

```bash
shasum -a 256 dist/manifest.json dist/assets/*.js dist/assets/*.css
```

Use `npm install` only when intentionally updating dependencies; `npm ci` is
what makes the install deterministic.

## Run the demo

```bash
npm ci
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

## Continuous integration

Every pull request and push to `main` runs
[`/.github/workflows/ci.yml`](./.github/workflows/ci.yml): `npm ci`, type
check, build, and `npm run verify`. The single `dist/` tree digest is printed
in the run summary so contributors and reviewers can confirm the build is
deterministic on Linux too.

Every tag matching `v*.*.*` runs
[`/.github/workflows/release.yml`](./.github/workflows/release.yml), which
builds the extension, zips `dist/` into `coldstamp-<version>.zip`, and
attaches that zip plus the SHA-256 digests to the GitHub release. The release
body is the canonical place to find the verification hash for that version.

[`/.github/workflows/secret-scan.yml`](./.github/workflows/secret-scan.yml)
runs gitleaks against every PR and push. Contributors can also enable the
same scan locally as a pre-commit hook — see [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[AGPL-3.0-only](./LICENSE). Copyleft on purpose: anyone can read, audit, and
modify ColdStamp, but a fork that adds features or changes redaction behaviour
must also stay open. This protects the trust contract — the product is "your
symmetric record"; a closed fork would be the opposite of that.

The privacy policy at <https://coldstamp.app/privacy.html> is the canonical
statement of what ColdStamp does and does not do with information about you.

## Verifying a release

Each tagged release on GitHub publishes the SHA-256 of `dist/` produced by CI.
To check that the Web Store build matches this source:

1. `git checkout v0.X.0` (the tag matching the version in Chrome Web Store)
2. `npm ci && npm run build && npm run verify`
3. Compare the single SHA-256 it prints against the value in that release's
   notes.

For a deeper check, also compare per-file hashes:

```bash
shasum -a 256 dist/manifest.json dist/assets/*.js dist/assets/*.css
```

A mismatch means the Web Store binary does not correspond to this source.
Open an issue immediately.
