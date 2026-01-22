let timer = null;
let timeLeft = 5 * 60; // 5 minutes
let isRunning = false;

const timeDisplay = document.getElementById('timeDisplay');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const resetBtn = document.getElementById('resetBtn');
const statusEl = document.getElementById('status');

chrome.storage.local.get(['timeLeft', 'timerRunning', 'blocked', 'dailyReset'], (data) => {
  if (data.timeLeft) timeLeft = data.timeLeft;
  if (data.timerRunning) startTimer();
  updateDisplay();
  updateStatus(data);
});
function updateDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
    timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  
  timerInterval = setInterval(() => {
    timeLeft--;
    chrome.storage.local.set({ timeLeft: timeLeft });
    updateDisplay();
    
    if (timeLeft === 60) {
      // Show warning notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon48.png',
        title: 'MovieBox Timer',
        message: '⚠️ MovieBox.ph will be blocked in 1 minute!',
        priority: 2
      });
    }
   if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      chrome.storage.local.set({ 
        timerRunning: false, 
        blocked: true,
        timeLeft: 0
      });
       // Update current tab if it's moviebox.ph
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs[0] && tabs[0].url.includes('moviebox.ph')) {
          chrome.tabs.reload(tabs[0].id);
        }
      });
      
      updateStatus({ blocked: true, timerRunning: false });
      alert('⛔ MovieBox.ph is now blocked for today!');
    }
  }, 1000);
   chrome.storage.local.set({ timerRunning: true });
  updateStatus({ timerRunning: true, blocked: false });
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
    chrome.storage.local.set({ timerRunning: false });
    updateStatus({ timerRunning: false, blocked: false });
  }
}
function resetTimer() {
  stopTimer();
  timeLeft = 5 * 60;
  chrome.storage.local.set({ 
    timeLeft: timeLeft,
    timerRunning: false,
    blocked: false,
    dailyReset: Date.now()
  });
  updateDisplay();
  updateStatus({ timerRunning: false, blocked: false });
  
  // Reload moviebox.ph tabs to remove block
  chrome.tabs.query({url: "*://moviebox.ph/*"}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.reload(tab.id);
    });
  });
  
  alert('✅ Timer has been reset! You can use MovieBox.ph again.');
}
startBtn.addEventListener('click', startTimer);
stopBtn.addEventListener('click', stopTimer);
resetBtn.addEventListener('click', resetTimer);

// Update status when storage changes
chrome.storage.onChanged.addListener((changes) => {
  chrome.storage.local.get(['blocked', 'timerRunning'], (data) => {
    updateStatus(data);
  });
});

// Update display every second to sync with background
setInterval(() => {
  chrome.storage.local.get(['timeLeft'], (data) => {
    if (data.timeLeft !== undefined && !timerInterval) {
      timeLeft = data.timeLeft;
      updateDisplay();
    }
  });
}, 1000);