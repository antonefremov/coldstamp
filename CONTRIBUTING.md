# Contributing to ColdStamp

Thanks for reading this — this is a small project maintained by one person.
Here's how to interact with it productively.

## Reporting bugs and asking questions

**Bugs and feature requests:** file a [GitHub issue](https://github.com/antonefremov/coldstamp/issues).
Before opening one, please:

- Check open and closed issues to avoid duplicates
- Include the browser version, OS, and extension version (visible in the
  popup footer)
- For dark-pattern detection misses or false positives: share the merchant
  page URL if it's public, or describe the page structure if not. A
  redacted bundle JSON export is the ideal attachment.

**Security issues** — do NOT use public issues. See [SECURITY.md](./SECURITY.md).

**Privacy enquiries** — email `privacy@coldstamp.app`.

## Pull requests

**Default policy: discuss first, code second.**

ColdStamp's scope is intentionally narrow. PRs that change capture
behaviour, redaction rules, the detector lexicons, or the consent flow
need to align with the threat model and the privacy policy — both of
which are publicly committed promises. Code first, discuss later wastes
your time when an idea conflicts with one of those promises.

The path that works:

1. **Open an issue** describing what you want to change and why
2. Wait for a reply confirming the change fits the project's direction
3. Submit a PR referencing the issue
4. Expect review feedback within a week (no SLA, but I try)

PRs that arrive without prior discussion may be closed without review.
This is not hostility — it is the only way a one-person project stays
focused.

## What this project is happy to accept

- **New dark-pattern detectors** that target a specific, documentable
  pattern with low false-positive risk
- **Lexicon additions** for `recurrence`, `addon`, `confirmshame` in
  `src/lib/lexicon.ts` — these are conservative on purpose; new entries
  should come with a real-world example
- **Per-site adapters** for known offenders (planned surface — not yet
  built)
- **Bug fixes** with a clear reproduction
- **Documentation improvements** — typos, clearer wording, missing pieces
- **Accessibility improvements** in the panel, popup, onboarding, and
  about pages
- **Translation contributions** — currently English only; a structured
  message catalog is a deliberate future task

## What this project is unlikely to accept

- **Adding any network call from the extension** — see THREAT_MODEL.md.
  The trust contract is "nothing leaves your device." A PR that breaks
  that contract — even with good intent — needs an exceptionally strong
  case and matching changes to the privacy policy first.
- **Telemetry, analytics, "anonymous" usage statistics, A/B testing**
- **Auto-cancellation or auto-filing of disputes** — explicitly out of
  scope per the spec; this is an evidence tool, not an action tool
- **Bundle storage anywhere other than the extension's IndexedDB**
- **Loosening of redaction** (e.g. "let me toggle card number visibility")
  — see the FAQ at <https://coldstamp.app/#faq> for the reasoning
- **Cosmetic refactors** with no behavioural change

## Code style

The codebase is TypeScript with `strict` and `noUncheckedIndexedAccess`.
Beyond that:

- **Default to writing no comments.** Only add a comment when the *why*
  is non-obvious — a hidden constraint, a subtle invariant, a workaround
  for a specific bug. Well-named identifiers explain *what* the code does.
- **No emoji in source files** unless they are user-facing copy where
  the design calls for them.
- **No introducing abstractions** beyond what the change requires. Three
  similar lines is better than a premature `factoryStrategy`.
- **Prefer editing existing files** to adding new ones.
- **No `any` unless you can defend it in the PR description.**

Build, type-check, and verify before pushing:

```bash
npm ci
npx tsc -b
npm run build
npm run verify
```

CI runs the same.

## Commit messages

Short imperative subject; body explaining *why* if not obvious from the
diff. Example:

```
Add merchantAccountHint for dispute identification

Lets a user link a bundle to an account at the merchant without exposing
the full email inside the sealed record. Matches the FAQ commitment from
last week.
```

## Local development

See [README.md](./README.md) — covers Node pin, install, build, the
fixture, loading unpacked.

### Optional: enable the pre-commit secret scan

```bash
brew install gitleaks   # or your package manager of choice
git config core.hooksPath .githooks
```

After that, every `git commit` runs `gitleaks protect --staged` against the
diff and refuses commits containing anything that looks like a credential.
The same check runs in CI on every PR, so this is purely a "catch it before
pushing" convenience.

If gitleaks isn't installed, the hook silently skips — it never blocks a
commit because of a missing binary.

## Code of conduct

Be kind, be brief, be specific. Disagreement is fine; personal attacks
are not. The maintainer's call is final on scope and direction; if a
disagreement runs deep enough, fork the project — that is what the
AGPL-3.0 license is for.

## License

By contributing, you agree your contribution is licensed under
[AGPL-3.0-only](./LICENSE) like the rest of the project.
