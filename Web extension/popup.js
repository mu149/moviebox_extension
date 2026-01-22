// Update timer start function
function startTimer() {
  if (isRunning) return;
  isRunning = true;
  
  // Notify content scripts that timer is running
  chrome.storage.local.set({ timerRunning: true });
  
  timer = setInterval(() => {
    timeLeft--;
    updateDisplay();
    
    if (timeLeft <= 0) {
      clearInterval(timer);
      chrome.storage.local.set({ timerRunning: false });
      
      // Show notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Timer Complete!',
        message: 'Great job! Take a 5-minute break.'
      });
      
      // Auto-start break timer
      startBreakTimer();
    }
  }, 1000);
}

function pauseTimer() {
  clearInterval(timer);
  isRunning = false;
  chrome.storage.local.set({ timerRunning: false });
}

function resetTimer() {
  clearInterval(timer);
  isRunning = false;
  chrome.storage.local.set({ timerRunning: false });
  timeLeft = parseInt(document.getElementById('focusTime').value) * 60;
  updateDisplay();
}

// Add break timer functionality
function startBreakTimer() {
  alert('⏱️ 25-minute focus session complete!\n\nTake a 5-minute break.\nMovieBox will be temporarily accessible.');
  
  // Temporary unblock for 5 minutes
  chrome.storage.local.set({ 
    timerRunning: false,
    onBreak: true,
    breakEnds: Date.now() + (5 * 60 * 1000)
  });
  
  // Auto-resume after break
  setTimeout(() => {
    chrome.storage.local.set({ onBreak: false });
    alert('Break time is over! Starting next focus session...');
    resetTimer();
    startTimer();
  }, 5 * 60 * 1000);
}