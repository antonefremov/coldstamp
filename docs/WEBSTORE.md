# Chrome Web Store listing — ColdStamp v0.2.0

Source of truth for the listing. Copy fields verbatim from here into the
Web Store developer dashboard when submitting. Update on every release.

---

## Name

> ColdStamp

(32 char limit, currently 9.)

## Short description

> Warns about dark patterns at checkout and quietly keeps your own record of what you agreed to. Local-only.

(132 char limit, currently 113.)

## Category

> Shopping

(Secondary candidates: *Tools*, *Privacy & Security*. Shopping is the
narrowest accurate match.)

## Language

> English (Australia)

## Detailed description

Paste the block below verbatim. Plain text — the store renders newlines but
not markdown.

```
ColdStamp is a quiet helper for online checkouts.

It does two things, both entirely on your device.

1. It warns you about dark patterns BEFORE you click.

On any checkout page, a small panel in the corner flags:
• A recurring or auto-renewing option that's already ticked for you.
• A free trial that quietly converts to a paid plan.
• A recurring price shown in much smaller or fainter type than the headline.
• An order total that's bigger than the items add up to.
• A "no" button worded to make you feel bad for declining.

The panel is informational. It does not change the page, submit anything, or
interfere with checkout. You can dismiss it.

2. It can keep your own record of what you agreed to (optional, off by default).

When you click a primary checkout button — Subscribe, Start free trial, Place
order — ColdStamp can snapshot the page at that moment: which boxes were
ticked, what prices were visible, what the payment request actually said. The
snapshot is stored locally on your device. Card numbers and CVVs are redacted
before anything is saved.

You can export any snapshot as a JSON file and use it however you like — for
example, attaching it to a chargeback claim.

Why this exists.

Subscription vendors keep structured, timestamped logs of every signup. When
something goes wrong, they show up to disputes with logs and screenshots. You
show up with a vague memory. ColdStamp is the user's side of that record. It
does not file disputes for you, does not connect to your bank, and does not
cancel subscriptions. It just makes sure that when you need to prove what the
page actually said, you can.

What ColdStamp does NOT do.

• It does not transmit any data over the internet. No accounts, no servers.
• It does not collect your name, email, card number, or browsing history.
• It does not auto-cancel subscriptions or auto-file disputes.
• It does not connect to your bank or payment provider.

Privacy.

Everything ColdStamp captures stays in your browser. There is no ColdStamp
server. The full privacy policy is linked below.

Source.

ColdStamp's source code is open: https://github.com/antonefremov/coldstamp

You must be 18 or older to use ColdStamp.
```

## Single purpose declaration

(The Web Store asks for one sentence.)

> ColdStamp protects users at online checkouts by warning about subscription
> dark patterns and letting them keep their own redacted record of what they
> agreed to.

## Permission justifications

Paste verbatim into the corresponding fields. Long-form versions are in
[`PERMISSIONS.md`](./PERMISSIONS.md).

### `storage`

> Stores the user's consent preferences (whether they have completed onboarding
> and which optional features they have opted into) so they are not asked again
> on every browser session. No personal information is stored under this
> permission.

### `activeTab`

> Used by the service worker to take a viewport screenshot of the active tab at
> the exact moment the user clicks a primary checkout button (e.g. Subscribe,
> Start free trial). The screenshot becomes part of the user's local evidence
> record. It is never transmitted off the device. activeTab is the narrowest
> permission that supports this — it only grants access at the user-initiated
> moment, not in the background.

### `host_permissions` (`http://*/*`, `https://*/*`)

> Required to inject the checkout-detection content script into any page the
> user visits. Checkouts can happen on any domain, so the set cannot be
> enumerated in advance. The script gates itself behind a checkout-detection
> heuristic and does nothing on pages that do not look like a checkout.
>
> activeTab is not sufficient because the script must run at document_start
> to observe payment requests before any merchant SDK loads — a privilege not
> granted by activeTab.

## Data handling disclosures

Answer the questionnaire as follows.

| Question | Answer |
|---|---|
| Does your extension collect personally identifiable information? | No |
| Does your extension collect health information? | No |
| Does your extension collect financial or payment information? | No |
| Does your extension collect authentication information? | No |
| Does your extension collect personal communications? | No |
| Does your extension collect location data? | No |
| Does your extension collect web history? | No |
| Does your extension collect user activity? | No |
| Does your extension collect website content? | No |

Reasoning to give if asked:

> ColdStamp processes the DOM of checkout pages on-device to detect dark
> patterns and (with the user's opt-in) to create a local evidence record.
> Nothing leaves the device. No data is uploaded to any server. The Web Store's
> data-collection questions concern data that flows to the developer; none of
> these apply.

Also check the three required attestations:

- [x] I do not sell or transfer user data to third parties.
- [x] I do not use or transfer user data for purposes unrelated to the item's
      single purpose.
- [x] I do not use or transfer user data to determine creditworthiness or for
      lending purposes.

## Privacy policy URL

> https://coldstamp.app/privacy.html

## Homepage URL

> https://coldstamp.app/

## Support email

> privacy@coldstamp.app

(Set up forwarding via Cloudflare Email Routing before submission. Replying
from a placeholder address will fail review.)

---

## Visual assets checklist

Required for submission. Stored in `docs/store-assets/` (gitignored binaries).

- [ ] **Icon 128×128 PNG** — already built (`src/icons/icon-128.png`).
- [ ] **Small promotional tile 440×280 PNG** — generated via
      `npm run promo-tile`. Source SVG: `src/icons/promo-tile.svg`.
- [ ] **Screenshots 1280×800 PNG** — at least 1, up to 5. Capture instructions
      in [`SCREENSHOTS.md`](./SCREENSHOTS.md).

Optional but recommended:

- [ ] **Marquee promotional tile 1400×560 PNG** — boosts placement; not blocking.
