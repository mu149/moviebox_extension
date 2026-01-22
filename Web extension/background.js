// Add this to background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "requestBreak") {
    // Grant break with duration
    const breakDuration = request.duration || 1; // minutes
    
    chrome.storage.local.set({
      timerRunning: false,
      onBreak: true,
      breakEnds: Date.now() + (breakDuration * 60 * 1000)
    });
    
    // Auto-resume after break
    setTimeout(() => {
      chrome.storage.local.set({ 
        onBreak: false,
        timerRunning: true 
      });
    }, breakDuration * 60 * 1000);
    
    sendResponse({ granted: true, duration: breakDuration });
    return true;
  }
  
  if (request.action === "resetCounter") {
    resetDailyCounter();
  }
});