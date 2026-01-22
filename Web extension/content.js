// Enhanced MovieBox blocker with better detection
(function() {
  'use strict';
  
  // List of known MovieBox domains
  const movieBoxDomains = [
    'movieboxpro.app',
    'moviebox.plus', 
    'mbxapp.com',
    'watchmoviebox.net',
    'movieboxpro.com',
    'moviebox.mx'
  ];
  
  // Check if current site is MovieBox
  function isMovieBoxSite() {
    const hostname = window.location.hostname.toLowerCase();
    return movieBoxDomains.some(domain => hostname.includes(domain));
  }
  
  // Check user preference
  chrome.storage.local.get(['blockMovieBox', 'timerRunning'], function(result) {
    const shouldBlock = result.blockMovieBox !== false; // Default to blocking
    const isTimerRunning = result.timerRunning || false;
    
    // Only block if both conditions are met
    if (isMovieBoxSite() && shouldBlock && isTimerRunning) {
      blockAccess();
    }
  });
  
  // Enhanced blocking function
  function blockAccess() {
    // Remove all existing content immediately
    document.documentElement.innerHTML = '';
    
    // Create blocking overlay
    const overlay = document.createElement('div');
    overlay.id = 'focus-blocker-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      z-index: 999999;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 20px;
      text-align: center;
    `;
    
    overlay.innerHTML = `
      <div style="max-width: 600px; background: rgba(0,0,0,0.8); padding: 40px; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
        <h1 style="font-size: 48px; margin-bottom: 20px;">⏰ Focus Time!</h1>
        <p style="font-size: 24px; margin-bottom: 30px; opacity: 0.9;">
          MovieBox is blocked during your focus session.
        </p>
        
        <div id="timerDisplay" style="font-size: 60px; font-weight: bold; margin: 30px 0; font-family: monospace;">
          25:00
        </div>
        
        <div style="margin: 30px 0;">
          <button id="unblockBtn" style="
            padding: 15px 30px;
            background: #e74c3c;
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 18px;
            cursor: pointer;
            margin-right: 15px;
            transition: all 0.3s;
          ">Take a Break (Unblock for 5 min)</button>
          
          <button id="goBackBtn" style="
            padding: 15px 30px;
            background: #3498db;
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 18px;
            cursor: pointer;
            transition: all 0.3s;
          ">Go to Previous Page</button>
        </div>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.2);">
          <p style="font-size: 16px; opacity: 0.7;">
            💡 <strong>Productivity Tip:</strong> Use the Pomodoro Technique - 25 minutes focused work, then 5 minutes break.
          </p>
          <p id="nextUnblock" style="font-size: 14px; opacity: 0.6; margin-top: 10px;">
            Auto-unlock in: <span id="countdown">--:--</span>
          </p>
        </div>
      </div>
    `;
    
    document.documentElement.appendChild(overlay);
    
    // Add button functionality
    document.getElementById('goBackBtn').addEventListener('click', () => {
      window.history.back();
    });
    
    document.getElementById('unblockBtn').addEventListener('click', () => {
      requestTemporaryUnblock();
    });
    
    // Start countdown timer
    startCountdown();
    
    // Prevent keyboard shortcuts
    document.addEventListener('keydown', preventBypass, true);
    
    // Prevent right-click
    document.addEventListener('contextmenu', preventBypass, true);
  }
  
  function preventBypass(e) {
    // Block common escape keys
    const escapeKeys = ['F12', 'Escape', 'F5', 'Ctrl+R', 'Ctrl+Shift+I', 'Ctrl+Shift+J', 'Ctrl+Shift+C'];
    
    if (escapeKeys.includes(e.key) || 
        (e.ctrlKey && ['r', 'i', 'j', 'c'].includes(e.key.toLowerCase()))) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }
  
  function startCountdown() {
    let timeLeft = 25 * 60; // 25 minutes
    
    const timerInterval = setInterval(() => {
      timeLeft--;
      
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      
      document.getElementById('timerDisplay').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      // Auto-unblock when timer reaches 0
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        document.getElementById('focus-blocker-overlay').innerHTML = `
          <div style="text-align: center; padding: 50px;">
            <h2 style="color: #2ecc71;">🎉 Time for a break!</h2>
            <p>MovieBox is now unblocked for 5 minutes.</p>
            <button onclick="location.reload()" style="
              padding: 15px 30px;
              background: #2ecc71;
              color: white;
              border: none;
              border-radius: 10px;
              font-size: 18px;
              cursor: pointer;
              margin-top: 20px;
            ">Refresh to Continue</button>
          </div>
        `;
      }
    }, 1000);
  }
  
  function requestTemporaryUnblock() {
    chrome.runtime.sendMessage({
      action: "requestBreak",
      duration: 5 // 5 minute break
    }, function(response) {
      if (response.granted) {
        // Show temporary unblock message
        document.getElementById('focus-blocker-overlay').innerHTML = `
          <div style="text-align: center; padding: 50px;">
            <h2 style="color: #f39c12;">☕ Take a 5-minute break!</h2>
            <p>MovieBox is temporarily unblocked. Timer will resume automatically.</p>
            <p id="breakCountdown" style="font-size: 32px; margin: 20px 0;">05:00</p>
            <button onclick="location.reload()" style="
              padding: 15px 30px;
              background: #f39c12;
              color: white;
              border: none;
              border-radius: 10px;
              font-size: 18px;
              cursor: pointer;
            ">Start Browsing</button>
          </div>
        `;
        
        // Countdown for break
        let breakTime = 5 * 60;
        const breakInterval = setInterval(() => {
          breakTime--;
          const minutes = Math.floor(breakTime / 60);
          const seconds = breakTime % 60;
          document.getElementById('breakCountdown').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
          if (breakTime <= 0) {
            clearInterval(breakInterval);
            location.reload(); // Reload to re-block
          }
        }, 1000);
      }
    });
  }
  
  // Listen for timer state changes
  chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (changes.timerRunning || changes.blockMovieBox) {
      chrome.storage.local.get(['blockMovieBox', 'timerRunning'], function(result) {
        const shouldBlock = result.blockMovieBox !== false;
        const isTimerRunning = result.timerRunning || false;
        
        if (isMovieBoxSite() && shouldBlock && isTimerRunning) {
          if (!document.getElementById('focus-blocker-overlay')) {
            blockAccess();
          }
        } else {
          const overlay = document.getElementById('focus-blocker-overlay');
          if (overlay) {
            overlay.remove();
          }
        }
      });
    }
  });
})();