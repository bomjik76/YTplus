// YouTube Speed Control - Content Script

// Settings state with default values
let settings = {
  defaultSpeed: '1',
  shortsSpeed: '1',
  videoSpeedControlEnabled: true,
  shortsSpeedControlEnabled: true,
  autoFullscreen: true,
  enableAutoScroll: true
};

// Global state variables
let currentVideoId = null;
let videoPlayer = null;
let injectedScriptReady = false;
const speedSteps = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4];
let lastScrollTime = 0;
let shortsCheckInterval = null;

// Initialize extension
function initialize() {
  console.log('YouTube Speed Control: initializing');
  
  // Save page load time
  window._pageLoadTime = Date.now();
  
  // Load settings
  loadSettings().then(() => {
    // Apply settings if video player already exists
    if (videoPlayer) {
      applySettings();
    }
  });
  
  // Watch for YouTube page changes
  watchForVideoChanges();
  
  // Setup URL change monitor
  setupURLChangeMonitor();
  
  // Inject script into YouTube page context
  injectYouTubeAPIAccess();
  
  // Setup message listeners
  setupMessageListeners();

  // Set up interval to recheck video speed for Shorts
  setInterval(checkAndFixShortsSpeed, 1000);
  
  // Setup simple shorts auto-scroll if enabled
  if (settings.enableAutoScroll) {
    setupShortsSimpleAutoScroll();
  }
}

// Function to setup simple auto-scroll for Shorts
function setupShortsSimpleAutoScroll() {
  // Clear existing interval if any
  if (shortsCheckInterval) {
    clearInterval(shortsCheckInterval);
  }
  
  // Set new interval for checking shorts videos
  shortsCheckInterval = setInterval(() => {
    if (!isOnShortsPage() || !settings.enableAutoScroll) return;
    
    try {
      // Find the current video that's playing
      const videos = Array.from(document.querySelectorAll('video'));
      if (videos.length === 0) return;
      
      // Find active video (playing or recently paused)
      const activeVideo = videos.find(v => !v.paused) || videos[0];
      if (!activeVideo || !activeVideo.duration) return;
      
      // Apply current speed to all videos, including the active one
      if (settings.shortsSpeedControlEnabled) {
        const shortsSpeed = parseFloat(settings.shortsSpeed);
        if (!isNaN(shortsSpeed)) {
          videos.forEach(video => {
            if (video.playbackRate !== shortsSpeed) {
              video.playbackRate = shortsSpeed;
            }
          });
        }
      }
      
      // Check if we're at the end of the video
      const timeLeft = activeVideo.duration - activeVideo.currentTime;
      const isNearEnd = timeLeft <= 0.5 && activeVideo.currentTime > 1;
      
      // If video is near the end and we haven't recently scrolled
      const now = Date.now();
      if (isNearEnd && now - lastScrollTime > 2000) {
        console.log(`Video at end (${activeVideo.currentTime.toFixed(2)}/${activeVideo.duration.toFixed(2)}), scrolling to next`);
        
        // Update last scroll time
        lastScrollTime = now;
        
        // Pause current video
        try {
          activeVideo.pause();
        } catch (e) {
          console.error('Error pausing video:', e);
        }
        
        // Scroll to next video - use multiple methods for reliability
        setTimeout(() => {
          // Method 1: Simulate key press
          simulateKeyPress('ArrowDown');
          
          // Method 2: Find and click the next button if available
          setTimeout(() => {
            try {
              const nextButton = document.querySelector('button.ytp-next-button, button[aria-label="Next"], button[aria-label*="Next"], button.next-button');
              if (nextButton) {
                nextButton.click();
                console.log('Clicked next button');
              }
            } catch (e) {
              console.error('Error clicking next button:', e);
            }
            
            // Method 3: After scrolling, try to play the next video
            setTimeout(() => {
              try {
                // Get fresh list of videos after scrolling
                const updatedVideos = document.querySelectorAll('video');
                for (const video of updatedVideos) {
                  if (video !== activeVideo && video.paused) {
                    // Apply speed first, then play
                    if (settings.shortsSpeedControlEnabled) {
                      const shortsSpeed = parseFloat(settings.shortsSpeed);
                      if (!isNaN(shortsSpeed)) {
                        video.playbackRate = shortsSpeed;
                      }
                    }
                    
                    // Try to play
                    video.play().then(() => {
                      console.log('Started playing next video');
                    }).catch(e => {
                      console.error('Error auto-playing next video:', e);
                      // Try spacebar as fallback
                      simulateKeyPress(' ');
                    });
                    
                    break;
                  }
                }
              } catch (e) {
                console.error('Error handling next video:', e);
                // Fallback to spacebar
                simulateKeyPress(' ');
              }
            }, 300);
          }, 100);
        }, 100);
      }
    } catch (e) {
      console.error('Error in shorts auto-scroll:', e);
    }
  }, 200);
}

// Load settings from chrome storage
function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get({
      defaultSpeed: '1',
      shortsSpeed: '1',
      videoSpeedControlEnabled: true,
      shortsSpeedControlEnabled: true,
      autoFullscreen: true,
      enableAutoScroll: true
    }, (items) => {
      settings = items;
      console.log('Settings loaded:', settings);
      resolve(settings);
    });
  });
}

// Setup message listeners for popup and injected script communication
function setupMessageListeners() {
  // Listen for messages from the injected script
  window.addEventListener('message', (event) => {
    // Only process messages from the same window
    if (event.source !== window) return;
    
    const { data } = event;
    
    if (!data || !data.action) return;
    
    switch (data.action) {
      case 'injectedScriptReady':
        console.log('Injected script is ready');
        injectedScriptReady = true;
        if (videoPlayer) applySettings();
        break;
        
      case 'setPlaybackRateResult':
        console.log('Speed set result:', data.success, data.speed);
        break;
        
      case 'setSpeedControlStateResult':
        console.log('Speed Control state set:', data.success, data.enabled);
        break;
    }
  });
  
  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'settingsUpdated') {
      try {
        // Save previous state for comparison
        const wasVideoEnabled = settings.videoSpeedControlEnabled;
        const wasShortsEnabled = settings.shortsSpeedControlEnabled;
        const wasAutoScrollEnabled = settings.enableAutoScroll;
        
        // Update settings
        settings = message.settings;
        console.log('Settings updated:', settings);
        
        // Handle Speed Control state change for current page type
        const isShorts = isOnShortsPage();
        const speedControlEnabled = isShorts ? settings.shortsSpeedControlEnabled : settings.videoSpeedControlEnabled;
        const wasEnabled = isShorts ? wasShortsEnabled : wasVideoEnabled;
        
        if (wasEnabled !== speedControlEnabled) {
          sendSpeedControlState(speedControlEnabled);
        }
        
        // Handle auto-scroll state change
        if (wasAutoScrollEnabled !== settings.enableAutoScroll) {
          if (settings.enableAutoScroll && isOnShortsPage()) {
            setupShortsSimpleAutoScroll();
          } else if (shortsCheckInterval) {
            clearInterval(shortsCheckInterval);
            shortsCheckInterval = null;
          }
        }
        
        // Apply settings to current video if it exists
        if (videoPlayer) {
          applySettings();
        }
        
        // Send response immediately
        sendResponse({success: true});
      } catch (e) {
        console.error('Error handling settings update:', e);
        sendResponse({success: false, error: e.message});
      }
      
      // Return true to indicate async response
      return true;
    }
  });
}

// Function to check for URL changes
function setupURLChangeMonitor() {
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  // Override history methods
  history.pushState = function() {
    originalPushState.apply(this, arguments);
    setTimeout(() => {
      if (isOnShortsPage() && settings.enableAutoScroll) {
        console.log('URL changed, re-enabling shorts auto-scroll');
        setupShortsSimpleAutoScroll();
      }
    }, 500);
  };
  
  history.replaceState = function() {
    originalReplaceState.apply(this, arguments);
    setTimeout(() => {
      if (isOnShortsPage() && settings.enableAutoScroll) {
        console.log('URL changed, re-enabling shorts auto-scroll');
        setupShortsSimpleAutoScroll();
      }
    }, 500);
  };
  
  window.addEventListener('popstate', () => {
    setTimeout(() => {
      if (isOnShortsPage() && settings.enableAutoScroll) {
        console.log('URL changed, re-enabling shorts auto-scroll');
        setupShortsSimpleAutoScroll();
      }
    }, 500);
  });
}

// Function to periodically check and fix Shorts speed
function checkAndFixShortsSpeed() {
  if (!isOnShortsPage() || !settings.shortsSpeedControlEnabled) return;
  
  try {
    const videos = document.querySelectorAll('video');
    if (videos.length === 0) return;
    
    const shortsSpeed = parseFloat(settings.shortsSpeed);
    if (isNaN(shortsSpeed)) return;
    
    // Track if we successfully set the speed
    let speedSet = false;
    
    videos.forEach(video => {
      // Only fix speed if it's different from what it should be
      if (Math.abs(video.playbackRate - shortsSpeed) > 0.01) {
        console.log(`Fixing Shorts speed: ${video.playbackRate} -> ${shortsSpeed}`);
        
        // Try multiple methods to ensure speed is set
        try {
          // Method 1: Direct property assignment with a retry
          for (let i = 0; i < 3; i++) {
            video.playbackRate = shortsSpeed;
            if (Math.abs(video.playbackRate - shortsSpeed) <= 0.01) {
              speedSet = true;
              break;
            }
          }
          
          // Method 2: Force speed using defineProperty if needed
          if (!speedSet && (shortsSpeed > 2 || shortsSpeed < 0.5)) {
            try {
              const originalDescriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'playbackRate');
              Object.defineProperty(video, 'playbackRate', {
                configurable: true,
                get: function() {
                  return shortsSpeed;
                },
                set: function() {
                  // Allow setting but always return our value
                  return shortsSpeed;
                }
              });
              
              // Also set it directly for good measure
              video.playbackRate = shortsSpeed;
              speedSet = true;
              
              // Restore original property after a delay
              setTimeout(() => {
                try {
                  delete video.playbackRate;
                  if (originalDescriptor) {
                    Object.defineProperty(video, 'playbackRate', originalDescriptor);
                  }
                } catch (e) {
                  console.error('Error restoring playbackRate property:', e);
                }
              }, 1000);
            } catch (e) {
              console.error('Error using defineProperty for playbackRate:', e);
            }
          }
          
          // Method 3: Use the YouTube HTML5 API
          const players = Array.from(document.querySelectorAll('.html5-video-player'));
          players.forEach(player => {
            if (typeof player.setPlaybackRate === 'function') {
              try {
                player.setPlaybackRate(shortsSpeed);
                speedSet = true;
              } catch (e) {
                console.error('Error using player.setPlaybackRate:', e);
              }
            }
          });
          
          // Method 4: Use movie_player
          const moviePlayer = document.getElementById('movie_player');
          if (moviePlayer && typeof moviePlayer.setPlaybackRate === 'function') {
            try {
              moviePlayer.setPlaybackRate(shortsSpeed);
              speedSet = true;
            } catch (e) {
              console.error('Error using movie_player.setPlaybackRate:', e);
            }
          }
          
          // Method 5: Dispatch events
          video.dispatchEvent(new Event('ratechange', { bubbles: true }));
          
          // Method 6: Try using the injected script as last resort
          if (injectedScriptReady) {
            sendSpeedToInjectedScript(shortsSpeed);
          }
        } catch (e) {
          console.error('Error setting video speed:', e);
        }
      } else {
        // Speed is already correct
        speedSet = true;
      }
    });
    
    // If we couldn't set the speed, log it
    if (!speedSet) {
      console.warn(`Failed to set Shorts speed to ${shortsSpeed}x`);
    }
  } catch (e) {
    console.error('Error in checkAndFixShortsSpeed:', e);
  }
}

// Apply current settings to video
function applySettings() {
  if (!videoPlayer) return;
  
  try {
    // Determine if on Shorts page
    const isShorts = isOnShortsPage();
    
    // Get appropriate speed control setting based on page type
    const speedControlEnabled = isShorts ? settings.shortsSpeedControlEnabled : settings.videoSpeedControlEnabled;
    
    // Send Speed Control state to injected script
    sendSpeedControlState(speedControlEnabled);
    
    // Check if speed control is enabled for this type of content
    if (speedControlEnabled) {
      // Select speed based on page type
      const speed = parseFloat(isShorts ? settings.shortsSpeed : settings.defaultSpeed);
      console.log(`Applying ${isShorts ? 'Shorts' : 'regular'} video speed: ${speed}x`);
      
      // Set speed directly for all videos on page
      setSpeedForAllVideos(speed);
      
      // Send speed to injected script if ready
      if (injectedScriptReady) {
        sendSpeedToInjectedScript(speed);
      }
    } else {
      // If speed control is disabled for this content type, set normal speed
      setSpeedForAllVideos(1.0);
      
      if (injectedScriptReady) {
        sendSpeedToInjectedScript(1.0);
      }
    }
    
    // Enable fullscreen if setting is active and on video page
    if (settings.autoFullscreen && isOnVideoPage()) {
      setTimeout(toggleFullscreen, 1000);
    }
    
    // Setup auto-scroll for Shorts if enabled
    if (settings.enableAutoScroll && isOnShortsPage()) {
      setupShortsSimpleAutoScroll();
    }
  } catch (e) {
    console.error('Error applying settings:', e);
  }
}

// Set playback speed for all videos on the page
function setSpeedForAllVideos(speed) {
  try {
    // Round to 2 decimal places for consistency
    speed = Math.round(speed * 100) / 100;
    
    // Try multiple methods to ensure speed is set correctly
    
    // Method 1: Set speed on all video elements
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
      try {
        // Direct speed setting
        video.playbackRate = speed;
        
        // Force 4x speed using Object.defineProperty if needed
        if (speed === 4 && video.playbackRate !== 4) {
          Object.defineProperty(video, 'playbackRate', {
            writable: true,
            value: 4
          });
        }
        
        // Dispatch event to ensure UI updates
        video.dispatchEvent(new Event('ratechange', { bubbles: true }));
      } catch (err) {
        console.error('Error setting video speed directly:', err);
      }
    });
    
    // Method 2: Try using the YouTube movie_player API
    const player = document.getElementById('movie_player');
    if (player && typeof player.setPlaybackRate === 'function') {
      try {
        player.setPlaybackRate(speed);
      } catch (e) {
        console.error('Error using movie_player.setPlaybackRate:', e);
      }
    }
    
    // Method 3: Try setting via YouTube API if available
    if (window.yt && window.yt.player) {
      try {
        const playerIds = Object.keys(window.yt.player);
        playerIds.forEach(id => {
          const ytPlayer = window.yt.player[id];
          if (ytPlayer && typeof ytPlayer.setPlaybackRate === 'function') {
            ytPlayer.setPlaybackRate(speed);
          }
        });
      } catch (e) {
        console.error('Error using YouTube player API:', e);
      }
    }
    
    // Method 4: Use injected script for maximum compatibility
    if (injectedScriptReady) {
      sendSpeedToInjectedScript(speed);
    }
    
    console.log(`Speed set to ${speed}x using multiple methods`);
  } catch (e) {
    console.error('Error setting speed for all videos:', e);
  }
}

// Send Speed Control state to injected script
function sendSpeedControlState(enabled) {
  if (!injectedScriptReady) {
    console.log('Injected script not ready, cannot send Speed Control state');
    return;
  }
  
  try {
    window.postMessage({
      action: 'setSpeedControlState',
      enabled: enabled
    }, '*');
    console.log('Speed Control state sent to injected script:', enabled);
  } catch (e) {
    console.error('Error sending Speed Control state to injected script:', e);
  }
}

// Watch for video changes on YouTube page
function watchForVideoChanges() {
  // Use a single MutationObserver with debounced handler for better performance
  const observer = new MutationObserver(debounce(() => {
    const newVideoId = getVideoIdFromUrl();
    const onVideoPage = isOnVideoPage();
    const onShortsPage = isOnShortsPage();
    
    if ((onVideoPage && currentVideoId !== newVideoId) || 
        (onShortsPage && document.querySelector('video') && !videoPlayer)) {
      
      if (onVideoPage) {
        currentVideoId = newVideoId;
        console.log('New video detected:', currentVideoId);
      } else if (onShortsPage) {
        console.log('Shorts video detected');
      }
      
      onVideoChange();
    }
  }, 100));
  
  // Start observing body for changes
  observer.observe(document.body, { 
    childList: true, 
    subtree: true,
    attributes: false,
    characterData: false
  });
  
  // Check on initial load
  if (isOnVideoPage()) {
    currentVideoId = getVideoIdFromUrl();
    console.log('Initial video detected:', currentVideoId);
    onVideoChange();
  } else if (isOnShortsPage()) {
    console.log('Initial Shorts video detected');
    onVideoChange();
  }
}

// Debounce function to improve performance
function debounce(func, wait) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

// Check if on video page
function isOnVideoPage() {
  return window.location.pathname === '/watch';
}

// Check if on shorts page
function isOnShortsPage() {
  const url = window.location.href;
  return url.includes('youtube.com/shorts/');
}

// Extract video ID from URL
function getVideoIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('v');
}

// Wait for video element to appear
function waitForVideoElement() {
  return new Promise((resolve) => {
    // Check if video already exists
    let video = document.querySelector('video');
    if (video) {
      videoPlayer = video;
      resolve(video);
      return;
    }
    
    // Set up observer to watch for video element
    const observer = new MutationObserver((mutations) => {
      video = document.querySelector('video');
      if (video) {
        videoPlayer = video;
        observer.disconnect();
        resolve(video);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false
    });
    
    // Timeout after 10 seconds
    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, 10000);
  });
}

// Actions to take when video changes
function onVideoChange() {
  // Wait for video element to appear
  waitForVideoElement().then((video) => {
    if (!video) {
      console.error('Video element not found');
      return;
    }
    
    console.log('Video player found, applying settings');
    
    // Apply settings to the video
    applySettings();
    
    // Setup keyboard shortcuts
    setupKeyboardMonitoring();
    
    // For Shorts, ensure we keep checking the speed
    if (isOnShortsPage()) {
      checkAndFixShortsSpeed();
      
      // Setup auto-scroll if enabled
      if (settings.enableAutoScroll) {
        setupShortsSimpleAutoScroll();
      }
    }
  });
}

// Increase playback speed
function increaseSpeed() {
  if (!videoPlayer) {
    // If videoPlayer is not set, try to find a video element
    const videos = document.querySelectorAll('video');
    if (videos.length > 0) {
      videoPlayer = videos[0];
    } else {
      console.error('No video player found for increasing speed');
      return;
    }
  }
  
  // Determine if on Shorts page and get appropriate speed control setting
  const isShorts = isOnShortsPage();
  const speedControlEnabled = isShorts ? settings.shortsSpeedControlEnabled : settings.videoSpeedControlEnabled;
  
  // Don't change speed if Speed Control is disabled for this content type
  if (!speedControlEnabled) return;
  
  try {
    // Get current speed
    let currentSpeed = videoPlayer.playbackRate;
    
    // If current speed seems invalid, get it from settings
    if (isNaN(currentSpeed) || currentSpeed <= 0) {
      currentSpeed = parseFloat(isShorts ? settings.shortsSpeed : settings.defaultSpeed);
    }
    
    // Find next speed in steps
    let nextSpeedIndex = -1;
    for (let i = 0; i < speedSteps.length; i++) {
      if (speedSteps[i] > currentSpeed) {
        nextSpeedIndex = i;
        break;
      }
    }
    
    // If we found a valid next speed
    if (nextSpeedIndex !== -1) {
      const newSpeed = speedSteps[nextSpeedIndex];
      console.log(`Increasing speed from ${currentSpeed}x to ${newSpeed}x`);
      
      // Set speed for all videos
      setSpeedForAllVideos(newSpeed);
      
      // Update UI indicator
      updateSpeedText(newSpeed);
      
      // Store the new speed based on content type
      if (isShorts) {
        settings.shortsSpeed = newSpeed.toString();
      } else {
        settings.defaultSpeed = newSpeed.toString();
      }
      
      // Save settings
      chrome.storage.sync.set(settings, () => {
        console.log(`Saved new ${isShorts ? 'Shorts' : 'video'} speed: ${newSpeed}x`);
      });
    }
  } catch (e) {
    console.error('Error increasing speed:', e);
  }
}

// Setup keyboard shortcuts
const setupKeyboardMonitoring = () => {
  // Remove existing listener if any
  if (window._keyHandler) {
    document.removeEventListener('keydown', window._keyHandler);
    window._keyListenerAdded = false;
  }
  
  const keyHandler = (event) => {
    // Check if we should handle this key press
    
    // Prevent handling if input is focused
    if (document.activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
      return;
    }
    
    // Get active video element - necessary for speed control
    if (!videoPlayer) {
      // Try to find a video element if videoPlayer is not set
      const videos = document.querySelectorAll('video');
      if (videos.length > 0) {
        videoPlayer = videos[0];
      } else {
        return; // No video found, exit
      }
    }
    
    // Determine if on Shorts page and get appropriate speed control setting
    const isShorts = isOnShortsPage();
    const speedControlEnabled = isShorts ? settings.shortsSpeedControlEnabled : settings.videoSpeedControlEnabled;
    
    // Don't handle shortcuts if Speed Control is disabled for this content type
    if (!speedControlEnabled) return;
    
    // Handle keyboard shortcuts for speed control
    let handled = false;
    
    // Enhanced keyboard shortcut handling
    switch (event.key) {
      // Speed increase/decrease with plus/minus
      case '+':
      case '=':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          event.stopPropagation();
          console.log('Ctrl+ pressed, increasing speed');
          increaseSpeed();
          handled = true;
        }
        break;
        
      case '-':
      case '_':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          event.stopPropagation();
          console.log('Ctrl- pressed, decreasing speed');
          decreaseSpeed();
          handled = true;
        }
        break;
        
      // Reset speed with Ctrl+0
      case '0':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          event.stopPropagation();
          console.log('Ctrl+0 pressed, resetting speed to 1x');
          resetSpeed();
          handled = true;
        }
        break;
        
      // Direct speed setting with number keys (when Alt is pressed)
      case '1':
      case '2': 
      case '3':
      case '4':
        if (event.altKey) {
          event.preventDefault();
          event.stopPropagation();
          const speed = parseInt(event.key);
          console.log(`Alt+${event.key} pressed, setting speed to ${speed}x`);
          setDirectSpeed(speed);
          handled = true;
        }
        break;
      
      // Half-speed with Alt+5
      case '5':
        if (event.altKey) {
          event.preventDefault();
          event.stopPropagation();
          console.log('Alt+5 pressed, setting speed to 0.5x');
          setDirectSpeed(0.5);
          handled = true;
        }
        break;
        
      // Quarter-speed with Alt+6
      case '6':
        if (event.altKey) {
          event.preventDefault();
          event.stopPropagation();
          console.log('Alt+6 pressed, setting speed to 0.25x');
          setDirectSpeed(0.25);
          handled = true;
        }
        break;
    }
    
    if (handled) {
      // Force reload current video speed after handling shortcut
      setTimeout(() => {
        if (isOnShortsPage() && settings.shortsSpeedControlEnabled) {
          checkAndFixShortsSpeed();
        }
      }, 100);
    }
  };
  
  // Save reference to keyHandler for potential removal
  window._keyHandler = keyHandler;
  
  // Add key event listener with capture phase for better priority
  if (!window._keyListenerAdded) {
    document.addEventListener('keydown', keyHandler, true);
    window._keyListenerAdded = true;
    console.log('Keyboard shortcuts for speed control are active');
  }
};

// Decrease playback speed
function decreaseSpeed() {
  if (!videoPlayer) {
    // If videoPlayer is not set, try to find a video element
    const videos = document.querySelectorAll('video');
    if (videos.length > 0) {
      videoPlayer = videos[0];
    } else {
      console.error('No video player found for decreasing speed');
      return;
    }
  }
  
  // Determine if on Shorts page and get appropriate speed control setting
  const isShorts = isOnShortsPage();
  const speedControlEnabled = isShorts ? settings.shortsSpeedControlEnabled : settings.videoSpeedControlEnabled;
  
  // Don't change speed if Speed Control is disabled for this content type
  if (!speedControlEnabled) return;
  
  try {
    // Get current speed
    let currentSpeed = videoPlayer.playbackRate;
    
    // If current speed seems invalid, get it from settings
    if (isNaN(currentSpeed) || currentSpeed <= 0) {
      currentSpeed = parseFloat(isShorts ? settings.shortsSpeed : settings.defaultSpeed);
    }
    
    // Find previous speed in steps
    let prevSpeedIndex = -1;
    for (let i = speedSteps.length - 1; i >= 0; i--) {
      if (speedSteps[i] < currentSpeed) {
        prevSpeedIndex = i;
        break;
      }
    }
    
    // If we found a valid previous speed
    if (prevSpeedIndex !== -1) {
      const newSpeed = speedSteps[prevSpeedIndex];
      console.log(`Decreasing speed from ${currentSpeed}x to ${newSpeed}x`);
      
      // Set speed for all videos
      setSpeedForAllVideos(newSpeed);
      
      // Update UI indicator
      updateSpeedText(newSpeed);
      
      // Store the new speed based on content type
      if (isShorts) {
        settings.shortsSpeed = newSpeed.toString();
      } else {
        settings.defaultSpeed = newSpeed.toString();
      }
      
      // Save settings
      chrome.storage.sync.set(settings, () => {
        console.log(`Saved new ${isShorts ? 'Shorts' : 'video'} speed: ${newSpeed}x`);
      });
    }
  } catch (e) {
    console.error('Error decreasing speed:', e);
  }
}

// Reset playback speed to normal
function resetSpeed() {
  if (!videoPlayer) {
    // If videoPlayer is not set, try to find a video element
    const videos = document.querySelectorAll('video');
    if (videos.length > 0) {
      videoPlayer = videos[0];
    } else {
      console.error('No video player found for resetting speed');
      return;
    }
  }
  
  // Determine if on Shorts page and get appropriate speed control setting
  const isShorts = isOnShortsPage();
  const speedControlEnabled = isShorts ? settings.shortsSpeedControlEnabled : settings.videoSpeedControlEnabled;
  
  try {
    const normalSpeed = 1.0;
    console.log(`Resetting to normal speed (1.0x)`);
    
    // Set speed for all videos
    setSpeedForAllVideos(normalSpeed);
    
    // Update UI indicator
    updateSpeedText(normalSpeed);
    
    // Only update settings if speed control is enabled for this content type
    if (speedControlEnabled) {
      // Store the new speed based on content type
      if (isShorts) {
        settings.shortsSpeed = normalSpeed.toString();
      } else {
        settings.defaultSpeed = normalSpeed.toString();
      }
      
      // Save settings
      chrome.storage.sync.set(settings, () => {
        console.log(`Saved reset ${isShorts ? 'Shorts' : 'video'} speed: ${normalSpeed}x`);
      });
    }
  } catch (e) {
    console.error('Error resetting speed:', e);
  }
}

// Update speed display on page
function updateSpeedText(speed) {
  try {
    // Determine content type for display
    const contentType = isOnShortsPage() ? 'Shorts' : 'Video';
    
    // Create or update speed indicator element
    let speedIndicator = document.getElementById('yt-speed-indicator');
    
    if (!speedIndicator) {
      // Create new indicator if it doesn't exist
      speedIndicator = document.createElement('div');
      speedIndicator.id = 'yt-speed-indicator';
      speedIndicator.style.position = 'fixed';
      speedIndicator.style.top = '10px';
      speedIndicator.style.right = '10px';
      speedIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      speedIndicator.style.color = 'white';
      speedIndicator.style.padding = '5px 10px';
      speedIndicator.style.borderRadius = '4px';
      speedIndicator.style.zIndex = '9999';
      speedIndicator.style.fontFamily = 'Arial, sans-serif';
      speedIndicator.style.fontSize = '14px';
      speedIndicator.style.transition = 'opacity 0.5s ease-in-out';
      document.body.appendChild(speedIndicator);
    }
    
    // Update text and ensure it's visible
    speedIndicator.textContent = `${contentType}: ${speed}x`;
    speedIndicator.style.opacity = '1';
    
    // Hide after 2 seconds
    clearTimeout(window._speedIndicatorTimeout);
    window._speedIndicatorTimeout = setTimeout(() => {
      speedIndicator.style.opacity = '0';
    }, 2000);
  } catch (e) {
    console.error('Error updating speed text:', e);
  }
}

// Toggle fullscreen mode
function toggleFullscreen() {
  try {
    // Find fullscreen button
    const fullscreenButton = document.querySelector('.ytp-fullscreen-button');
    if (fullscreenButton) {
      fullscreenButton.click();
    }
  } catch (e) {
    console.error('Error toggling fullscreen:', e);
  }
}

// Inject script into YouTube page
function injectYouTubeAPIAccess() {
  try {
    // Create script element
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('js/injected.js');
    script.onload = function() {
      console.log('YouTube Speed Control: Injected script loaded');
    };
    
    // Inject into page
    (document.head || document.documentElement).appendChild(script);
  } catch (e) {
    console.error('Error injecting script:', e);
  }
}

// Send speed to injected script
function sendSpeedToInjectedScript(speed) {
  if (!injectedScriptReady) {
    console.log('Injected script not ready, cannot send speed');
    return;
  }
  
  try {
    window.postMessage({
      action: 'setPlaybackRate',
      speed: speed
    }, '*');
    console.log('Speed sent to injected script:', speed);
  } catch (e) {
    console.error('Error sending speed to injected script:', e);
  }
}

// Simulate keyboard event (spacebar or arrow key)
function simulateKeyPress(key) {
  try {
    let keyCode, code;
    
    // Set appropriate key codes
    if (key === ' ') {
      keyCode = 32;
      code = 'Space';
    } else if (key === 'ArrowDown') {
      keyCode = 40;
      code = 'ArrowDown';
    } else {
      keyCode = key.charCodeAt(0);
      code = key;
    }
    
    // Create and dispatch keydown event with more options for better reliability
    const keyDownEvent = new KeyboardEvent('keydown', {
      key: key,
      code: code,
      keyCode: keyCode,
      which: keyCode,
      bubbles: true,
      cancelable: true,
      view: window,
      composed: true
    });
    
    // Try different targets for more reliability
    const targets = [
      document.activeElement,
      document.querySelector('video'),
      document.body,
      document
    ];
    
    // Try dispatching to different targets
    let dispatched = false;
    for (const target of targets) {
      if (target) {
        try {
          const result = target.dispatchEvent(keyDownEvent);
          if (result) dispatched = true;
        } catch (e) {
          console.error(`Error dispatching keydown to ${target.tagName}:`, e);
        }
      }
    }
    
    if (!dispatched) {
      // Last resort: dispatch to document
      document.dispatchEvent(keyDownEvent);
    }
    
    // Add small delay before keyup for better simulation
    setTimeout(() => {
      // Create and dispatch keyup event
      const keyUpEvent = new KeyboardEvent('keyup', {
        key: key,
        code: code,
        keyCode: keyCode,
        which: keyCode,
        bubbles: true,
        cancelable: true,
        view: window,
        composed: true
      });
      
      // Try different targets again
      let upDispatched = false;
      for (const target of targets) {
        if (target) {
          try {
            const result = target.dispatchEvent(keyUpEvent);
            if (result) upDispatched = true;
          } catch (e) {
            console.error(`Error dispatching keyup to ${target.tagName}:`, e);
          }
        }
      }
      
      if (!upDispatched) {
        // Last resort: dispatch to document
        document.dispatchEvent(keyUpEvent);
      }
    }, 50);
  } catch (e) {
    console.error(`Error simulating ${key} keypress:`, e);
  }
}

// Set a specific playback speed directly
function setDirectSpeed(speed) {
  if (!videoPlayer) {
    // If videoPlayer is not set, try to find a video element
    const videos = document.querySelectorAll('video');
    if (videos.length > 0) {
      videoPlayer = videos[0];
    } else {
      console.error('No video player found for setting speed');
      return;
    }
  }
  
  // Determine if on Shorts page and get appropriate speed control setting
  const isShorts = isOnShortsPage();
  const speedControlEnabled = isShorts ? settings.shortsSpeedControlEnabled : settings.videoSpeedControlEnabled;
  
  // Don't change speed if Speed Control is disabled for this content type
  if (!speedControlEnabled) return;
  
  try {
    console.log(`Setting ${isShorts ? 'Shorts' : 'video'} speed directly to ${speed}x`);
    
    // Set speed for all videos
    setSpeedForAllVideos(speed);
    
    // Update UI indicator
    updateSpeedText(speed);
    
    // Store the new speed based on content type
    if (isShorts) {
      settings.shortsSpeed = speed.toString();
    } else {
      settings.defaultSpeed = speed.toString();
    }
    
    // Save settings
    chrome.storage.sync.set(settings, () => {
      console.log(`Saved new ${isShorts ? 'Shorts' : 'video'} speed: ${speed}x`);
    });
    
    // For Shorts, ensure the speed is applied immediately
    if (isShorts) {
      setTimeout(checkAndFixShortsSpeed, 50);
    }
  } catch (e) {
    console.error('Error setting direct speed:', e);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

function showSpeedNotification(speed) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 10px 20px;
    border-radius: 5px;
    z-index: 9999;
    font-size: 16px;
    font-family: Arial, sans-serif;
  `;
  notification.textContent = `Скорость воспроизведения: ${speed}x`;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 1000);
} 