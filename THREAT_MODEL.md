# Threat model

What ColdStamp protects against, what it does not, and where the limits are
architectural rather than implementation gaps. This document is deliberately
short: a reader should be able to understand the trust contract in five
minutes.

## What ColdStamp is

A Chrome MV3 extension that runs entirely on the user's device. It does two
things at checkout pages: warns about dark patterns *before* a primary
button click (read-only DOM scan), and — if the user has opted in —
captures a redacted, hashed snapshot of the page state at the moment of
that click and stores it locally in IndexedDB.

There is no ColdStamp server in the current release.

## Assets we protect

- **The user's checkout intent and consent state.** Specifically: which
  boxes were pre-checked, whether recurring terms were visible, what the
  payment request actually said. The captured evidence about these is the
  user's leverage in a future dispute.
- **The user's privacy.** Card numbers, CVVs, and emails should never
  appear unredacted in any stored bundle.
- **The integrity of captured bundles.** Once a bundle exists, no
  external party should be able to silently mutate it without the user
  noticing.

## Adversaries we assume

| Adversary | What they want | What they can do |
|---|---|---|
| Merchant with dark-pattern checkout | Get the user signed up for recurring billing they did not knowingly consent to | Render any DOM, set any payment request, A/B test dark patterns |
| Third party who obtains an exported bundle | Use it as a privacy or fraud vector against the user | Read the JSON, screenshot it, post it |
| Curious or malicious bystander on the user's device | Read captured bundles without the user's intent | Open Chrome, click the popup |
| ColdStamp operator (us) | Hypothetically: harvest data, change the policy retroactively | Ship a new version |
| State-level / advanced threat | Compromise the browser, the OS, or the build pipeline | Everything below the abstraction |

## What ColdStamp prevents

- **Bundle data leaving the device.** No bundle leaves IndexedDB without
  an explicit user export action. There is no network code path that
  uploads bundles. CI on every release confirms the built artifact
  matches this source, so a future malicious release would have to break
  the verifiable-build chain to add such a path.
- **Card and CVV exposure in bundles.** Sensitive form values are
  redacted at the field level by `autocomplete` attribute and by regex
  before being written to storage. Raw payment request bodies are never
  stored — only a SHA-256 digest plus parsed `amount`/`currency`/`recurring`
  fields.
- **Email exposure in bundles.** Full email addresses are redacted; a
  partial hint (e.g. `an…@gmail.com`) is stored separately so the user
  can identify their own bundle without exposing the full address.
- **Capture without consent.** Sealed capture is gated on
  `purposes.core_protection !== null` in `chrome.storage.local`. The gate
  is checked at the start of every capture attempt; no code path bypasses
  it. The detection panel runs without storing anything about the user,
  so it remains useful pre-consent.
- **Silent post-hoc tampering of a bundle.** Each bundle has a SHA-256
  root over its canonical-JSON form. Any modification — even a single
  byte — changes the hash. The hash itself is part of the bundle, so an
  attacker can recompute it, but a third party comparing against a
  separately-recorded hash (such as a future RFC 3161 anchor) can detect
  the change.
- **Cross-site bundle visibility.** Bundles live in the extension's
  IndexedDB origin (`chrome-extension://<id>/`), not in any merchant
  site's storage, so merchants cannot read bundles even if the user
  later returns to the same site.

## What ColdStamp does NOT prevent

These are honest limits. Some are architectural; some are pragmatic.

- **A malicious merchant rendering a fake DOM to be captured.** The
  sealed bundle proves *the page rendered this DOM at time T*, not *this
  DOM is what a normal user would have seen*. Capture is a faithful
  recorder, not an honest-broker oracle. Where dispute outcomes turn on
  this, the `networkCharges[]` field is stronger evidence than DOM state
  because it comes from the merchant's own server-bound payment request.
- **A user fabricating their own bundle.** A user with developer skills
  could inject a fake DOM into a page they control, capture it, and
  present the bundle as evidence. The hash proves the bundle existed
  unaltered since T, not that the page was a real merchant checkout. The
  upcoming RFC 3161 anchor (M2) raises the bar by adding an *independent*
  timestamp, but does not eliminate the risk. ColdStamp is insurance for
  honest users, not a forensic oracle.
- **A compromised browser or OS.** A malicious extension with broader
  permissions, a system-level keylogger, or a hostile browser build can
  read anything the extension reads. ColdStamp's trust ceiling is the
  trust ceiling of the user's Chrome install.
- **Loss of bundles on device wipe.** Bundles live only in this
  browser's IndexedDB. Uninstalling the extension, clearing browser data,
  switching profiles, or replacing the device deletes them. Users
  concerned about durability are advised to export bundles they may need
  for disputes. Encrypted cloud backup is on the roadmap (M5) as an
  opt-in.
- **All dark patterns.** Detection is intentionally conservative: a
  single false positive costs more user trust than several missed
  detections build. There will always be subtler dark patterns the
  current detectors do not match. The capture layer is deliberately
  decoupled, so we can re-classify older bundles when new rules ship,
  without recapturing.
- **A future operator (us) shipping a malicious update.** Open source +
  reproducible build + signed release tags is the mitigation. A user who
  cares can pin a specific verified release and decline updates. We do
  not currently sign releases with a hardware key; we should.
- **Side-channel inference from the user's behaviour.** The interaction
  log timestamps clicks, focus, and scroll. In principle this could
  leak some behavioural data if a bundle is shared widely. It does not
  contain anything we consider PII, but a user passing a bundle to a
  party they do not fully trust should be aware.

## Out of scope for this model

- **Network observers between the user's browser and the merchant.** TLS
  is the merchant's responsibility, and ColdStamp does not add or remove
  that risk.
- **Coercion of the user to produce or destroy a bundle.** A locally
  controlled tool can be locally destroyed; cloud backup (when shipped)
  will not protect against coerced disclosure of the user's key.
- **The merchant subsequently changing their checkout page.** The
  bundle is a snapshot in time; future versions of the merchant page do
  not retroactively affect the snapshot.

## Where this lives in the code

- Capture gate: `src/content/index.ts:captureNow` — first lines, calls
  `hasCapture(await getConsent())` before doing anything.
- Redaction: `src/lib/redact.ts` — field-aware + regex fallback.
- Sealing: `src/lib/seal.ts` — deterministic canonicalisation + SHA-256.
- Email hint: `src/content/index.ts:deriveAccountHint` paired with
  `hintFromEmail` in `src/lib/redact.ts`.
- Storage in extension origin: `src/background.ts` `onMessage` →
  `putBundle`, which runs in the extension origin (not the merchant page
  origin).

If you find a path that contradicts any of the "What ColdStamp prevents"
claims above, please file it under our [security policy](./SECURITY.md).
That is exactly the kind of report we want.
