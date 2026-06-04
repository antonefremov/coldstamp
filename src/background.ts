// Service worker — only job in M1 is to grab a viewport screenshot on request.
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.kind !== "captureScreenshot") return;
  const windowId = sender.tab?.windowId;
  if (windowId == null) {
    sendResponse({ dataUrl: null });
    return;
  }
  chrome.tabs.captureVisibleTab(windowId, { format: "png" }, (dataUrl) => {
    if (chrome.runtime.lastError) {
      console.warn("[SI] capture failed", chrome.runtime.lastError.message);
      sendResponse({ dataUrl: null });
      return;
    }
    sendResponse({ dataUrl });
  });
  return true; // async response
});
