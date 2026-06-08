# Permission justifications

Source of truth for the Chrome Web Store listing. When the listing asks "why
do you need this permission?", copy from here verbatim. Keep these justifications
in sync with what the code actually does — if either drifts, fix both.

## `storage`

We use `chrome.storage.local` to persist the user's consent state (whether they
have completed first-run onboarding and which optional features they have
opted into). Without this, the user would be asked to consent on every browser
session.

We do not use `chrome.storage.sync` or any other cross-device storage.

The user's captured evidence bundles are stored in IndexedDB, not
`chrome.storage` — but storing consent there still requires the permission.

## `activeTab`

We use `chrome.tabs.captureVisibleTab()` from the background service worker
to take a screenshot of the visible viewport at the moment the user clicks a
primary checkout button (e.g. "Subscribe", "Start free trial"). The screenshot
is part of the evidence bundle stored locally on the user's device.

`activeTab` is the narrowest permission that allows this. It only grants
access to the tab the user is currently interacting with, only at the moment
they invoke the extension.

The screenshot is never transmitted off the device.

## `host_permissions`: `http://*/*` and `https://*/*`

ColdStamp must inject a content script into checkout pages at
`document_start`. Two genuine technical reasons require broad host access:

1. **Checkouts happen on any domain.** A user might check out at
   netflix.com today, a small Shopify store tomorrow, and a news paywall
   next week. We cannot enumerate the domains in advance.

2. **`activeTab` is not sufficient for our use case.** `activeTab` does not
   support `document_start` injection in MV3, and our preventative-detection
   layer needs to patch `window.fetch` and `XMLHttpRequest` in the page
   world before any merchant payment SDK loads. Late injection would miss the
   request, defeating the feature.

We do not need access to URLs the user is not actively visiting. The content
script runs only on pages the user navigates to.

The script itself is gated by a checkout-detection heuristic — on any page
that does not look like a checkout, the script exits early and does nothing.

## What we do NOT request

- `tabs` — we use `activeTab` instead, scoped to the current tab only.
- `cookies` — never read or written.
- `webRequest` — payment-ish requests are observed in-page via patched
  `fetch`/`XHR` (visible to the page itself), not via the privileged
  network API.
- `identity`, `oauth2` — no accounts, no login.
- `scripting` — content scripts are declared in the manifest, not injected
  programmatically.
- Cross-origin host permissions beyond `http://*/*` and `https://*/*`.
