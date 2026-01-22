// No icons, simple background script
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ blocked: false, timerRunning: false, dailyStart: Date.now() });
});
