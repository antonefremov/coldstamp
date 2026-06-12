# Security policy

ColdStamp is a privacy and consumer-protection tool. Security issues affect
the entire trust contract with users, so we take reports seriously and try to
resolve them quickly. This document explains how to report a vulnerability,
what to expect from us, and what we consider in or out of scope.

## How to report

Email **security@coldstamp.app** with:

- A description of the issue and its impact
- Steps to reproduce, or a proof-of-concept
- The commit SHA or version you tested against
- Your preferred name for credit in the fix notes (or "anonymous")

If your finding is sensitive, you may encrypt the report with our PGP key
(coming — for now, plain email is fine; do not include exploit code in plain
text if you can avoid it).

Please **do not** open a public GitHub issue for an unpatched vulnerability.

## What you can expect from us

- **Acknowledgment within 3 business days** that we received your report.
- **A triage assessment within 7 business days** — whether we consider the
  issue valid, the rough severity, and our intended fix path.
- **A fix or written explanation within 30 days** for valid findings. If a
  fix needs longer, we will say so and tell you when to expect the next
  update.
- **Public credit** in the release notes that ship the fix, unless you ask
  to remain anonymous.

We are a small project. We do not currently pay bug bounties.

## Scope

### In scope

- The extension source in this repository (`src/`, `scripts/`, `fixtures/`,
  `manifest.json`, build configuration)
- The reproducible-build pipeline and release attestations
- Privacy claims in the published [privacy policy](https://coldstamp.app/privacy.html)
- The static site at <https://coldstamp.app/>

Specifically, we are interested in:

- PII leakage from a captured bundle (anything that bypasses redaction)
- Routes through which captured data could leave the device
- Tamper paths against the sealed bundle (anything that could let a third
  party modify a bundle without changing its `rootHash`)
- Consent bypass — anything that causes capture to run without
  `core_protection` granted
- Privilege escalation from the content script into the extension origin
  beyond what the message API explicitly allows
- Build-pipeline supply-chain risks (lockfile tampering paths,
  reproducible-build divergence)

### Out of scope

- Vulnerabilities in third-party browser SDKs (Stripe, PayPal, etc.) loaded
  by merchant pages
- Issues that require a malicious extension already installed with broader
  permissions
- Social-engineering attacks against ColdStamp operators
- Self-XSS that requires the user to paste code into DevTools
- Reports based on outdated `npm audit` advisories without a demonstrated
  exploit path (we maintain an explicit list of known build-time advisories
  with reasoning in the repo)
- Issues in the example fixture (`fixtures/fake-checkout/`) — it is a
  contrived test page, not production code

## Safe harbour

We support good-faith security research. If you follow this policy:

- We will not pursue legal action against you for accessing systems within
  scope solely to identify a vulnerability.
- We will not report you to law enforcement.
- We treat your research activity as authorised under any applicable
  computer-misuse statutes for the scope described above.

Stay within scope, do not access user data beyond what is necessary to
demonstrate the issue, and do not exploit the issue beyond proof of concept.

Activities that fall outside safe harbour include: destruction or
modification of data you do not own; denial-of-service attacks; physical
attacks against people or property; social engineering of users or
operators.

## Disclosure

Our default is **coordinated disclosure**:

1. You report privately.
2. We fix and ship a release.
3. We publish a security advisory naming the issue, the fix commit, and
   credit (if you accept it).
4. Public discussion of the technical detail is welcome at that point.

If a fix takes unexpectedly long, we will work with you on a disclosure
timeline rather than ask for indefinite silence.

## Known-issue policy

When we accept that a `npm audit` advisory affects build-time-only code and
cannot reach a user of the published extension, we document the reasoning
inline rather than panic-bumping deps. These notes live near the dependency
or in the README. If you disagree with our reasoning, please report it as a
security finding — that is the right channel.

## Thanks

Researchers we credit here so far: *(none yet — be the first)*
