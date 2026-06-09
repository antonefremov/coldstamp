// Service worker. Runs in the extension origin, owns the canonical IndexedDB
// for evidence bundles (the popup reads from the same origin; content scripts
// cannot, because they run in the merchant page's origin).

import { putBundle } from "./lib/db";

// Open first-run onboarding on install (not on browser update).
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason !== "install") return;
  chrome.tabs.create({ url: chrome.runtime.getURL("src/onboarding/index.html") });
});

// Persist bundles handed off by the content script.
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.kind !== "saveBundle" || !msg.bundle) return;
  putBundle(msg.bundle)
    .then(() => sendResponse({ ok: true }))
    .catch((e) => {
      console.warn("[ColdStamp] putBundle failed", e);
      sendResponse({ ok: false });
    });
  return true; // async response
});

// Screenshot on demand from the content script.
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.kind !== "captureScreenshot") return;
  const windowId = sender.tab?.windowId;
  if (windowId == null) {
    sendResponse({ dataUrl: null });
    return;
  }
  chrome.tabs.captureVisibleTab(windowId, { format: "png" }, (dataUrl) => {
    if (chrome.runtime.lastError) {
      console.warn("[ColdStamp] capture failed", chrome.runtime.lastError.message);
      sendResponse({ dataUrl: null });
      return;
    }
    sendResponse({ dataUrl });
  });
  return true; // async response
});
