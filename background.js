chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ "timeasc": [true] });
  chrome.storage.local.set({ "tabname": "猥雑コメント" });
});