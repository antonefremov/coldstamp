// Service worker.

// Open first-run onboarding on install (not on browser update).
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason !== "install") return;
  chrome.tabs.create({ url: chrome.runtime.getURL("src/onboarding/index.html") });
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
