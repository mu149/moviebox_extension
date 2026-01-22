// Check if site should be blocked
function checkBlockStatus() {
  chrome.storage.local.get(['blocked', 'dailyReset'], (data) => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    // Check if 24 hours have passed since last reset
    if (data.dailyReset && (now - data.dailyReset) >= oneDay) {
      chrome.storage.local.set({
        blocked: false,
        timerRunning: false,
        timeLeft: 5 * 60,
        dailyReset: now
      });
      return;
    }
    
    // If blocked, show overlay
    if (data.blocked) {
      showBlockOverlay();
    }else{
      removeBlockOverlay();
    }
  });
}

function showBlockOverlay() {
  // Check if overlay already exists
  if (document.getElementById('moviebox-blocker-overlay')) return;
  
  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'moviebox-blocker-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    color: white;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    font-family: Arial, sans-serif;
    z-index: 999999;
    padding: 20px;
    text-align: center;
  `;
  
  overlay.innerHTML = `
    <div style="font-size: 72px; margin-bottom: 20px;">⏰</div>
    <h1 style="font-size: 32px; margin-bottom: 15px;">Time's Up!</h1>
    <p style="font-size: 18px; max-width: 400px; margin-bottom: 30px; line-height: 1.5;">
      You've reached your 5-minute limit on MovieBox.ph for today.
      Take a break and focus on other important tasks!
    </p>
    <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
      <p style="font-size: 14px; opacity: 0.9;">The timer resets automatically in 24 hours.</p>
      <p style="font-size: 14px; opacity: 0.9;">To reset manually, click the extension icon.</p>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // Prevent scrolling
  document.body.style.overflow = 'hidden';
  
  // Prevent any clicks on the page
  document.addEventListener('click', preventClicks, true);
  document.addEventListener('contextmenu', preventClicks, true);
  document.addEventListener('keydown', preventKeys, true);
}

function preventClicks(e) {
  e.stopPropagation();
  e.preventDefault();
  return false;
}

function preventKeys(e) {
  // Allow F5 for refresh and Ctrl+Shift+I for dev tools
  if (e.key === 'F5' || (e.ctrlKey && e.shiftKey && e.key === 'I')) return;
  e.stopPropagation();
  e.preventDefault();
  return false;
}

// Check block status when page loads
checkBlockStatus();

// Also check when storage changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.blocked || changes.dailyReset) {
    checkBlockStatus();
  }
});

// Check every minute for 24-hour reset
setInterval(checkBlockStatus, 60000);