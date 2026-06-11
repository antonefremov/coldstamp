# Web Store screenshots — capture guide

The Web Store accepts up to 5 screenshots, **1280×800** or **640×400** PNG.
We'll use 1280×800.

Capture each one as a real browser screenshot of the running extension
against the fixture (`npm run fixture` + load unpacked `dist/`). Stage the
window at exactly 1280×800 — use a tool like the macOS *Window Sizer* or
just resize and screenshot the window region. Save into
`docs/store-assets/` (gitignored).

Pre-flight (once):

- `npm run build` then load `dist/` unpacked at `chrome://extensions`
- Pin the toolbar icon
- Make sure consent is **on** for shots #2 and #3
- Use a clean Chrome profile if possible — no extension chrome from other
  extensions in frame

## Shot 1 — "The warning panel"

**Filename:** `01-warning-panel.png`

- Visit `http://localhost:5174`
- Wait for the panel to appear in the top-right
- Capture the full browser window with the fixture and the panel visible
- *Caption to use in the listing (optional, ≤140 chars):* "Catches pre-ticked
  recurring charges, buried renewal terms, and other dark patterns in real
  time."

## Shot 2 — "Your record of what you agreed to"

**Filename:** `02-popup-bundle.png`

- Submit the fixture form once so a bundle is captured
- Click the extension toolbar icon to open the popup
- Capture the browser with the popup open against the fixture page
- *Caption:* "When you click subscribe, ColdStamp keeps a redacted snapshot of
  what the page showed. On your device only."

## Shot 3 — "Exported evidence"

**Filename:** `03-exported-json.png`

- From the popup, click **Export** to download a bundle JSON
- Open the JSON file in your editor or in a browser tab
- Highlight a region of interest — e.g. the `controlState` entry for the
  cardnumber field showing `value: "[REDACTED]"`, or `networkCharges[0]`
  showing the parsed amount/currency/recurring
- *Caption:* "Card numbers and CVVs are redacted. The raw payment body is
  hashed, not stored. You can attach the JSON to a chargeback claim."

## Shot 4 (optional) — "How it works"

**Filename:** `04-how-it-works.png`

- From the popup footer click **How it works**
- Capture the about page
- *Caption:* "Two layers: warn you before you click, and keep your own record
  if you do."

## Shot 5 (optional) — "Onboarding / consent"

**Filename:** `05-onboarding.png`

- Open `chrome-extension://<id>/src/onboarding/index.html` in a tab
  (or reinstall the extension to trigger it)
- Capture the consent screen
- *Caption:* "Capture is off by default. You decide."

## Order in the listing

1, 2, 3 are the must-show story (problem → solution → proof). 4 and 5 are
trust-building. If we can only show three, ship 1 + 2 + 3.
