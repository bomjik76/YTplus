// YouTube Speed Control - Popup Script

document.addEventListener('DOMContentLoaded', () => {
  // Settings elements
  const elements = {
    defaultSpeedSelect: document.getElementById('defaultSpeed'),
    shortsSpeedSelect: document.getElementById('shortsSpeed'),
    videoSpeedControlEnabledCheckbox: document.getElementById('videoSpeedControlEnabled'),
    shortsSpeedControlEnabledCheckbox: document.getElementById('shortsSpeedControlEnabled'),
    autoFullscreenCheckbox: document.getElementById('autoFullscreen'),
    autoScrollShortsCheckbox: document.getElementById('autoScrollShorts'),
    enableAutoScrollCheckbox: document.getElementById('enableAutoScroll')
  };
  
  // Load settings
  loadSettings();
  
  // Add change event handlers for all settings elements
  Object.values(elements).forEach(element => {
    if (element) {
      element.addEventListener('change', saveSettings);
    }
  });
  
  // Function to load settings
  function loadSettings() {
    chrome.storage.sync.get({
      defaultSpeed: '1',
      shortsSpeed: '1',
      videoSpeedControlEnabled: true,
      shortsSpeedControlEnabled: true,
      autoFullscreen: true,
      autoScrollShorts: false,
      enableAutoScroll: true
    }, (items) => {
      // Update UI with loaded settings
      if (elements.defaultSpeedSelect) elements.defaultSpeedSelect.value = items.defaultSpeed;
      if (elements.shortsSpeedSelect) elements.shortsSpeedSelect.value = items.shortsSpeed;
      if (elements.videoSpeedControlEnabledCheckbox) elements.videoSpeedControlEnabledCheckbox.checked = items.videoSpeedControlEnabled;
      if (elements.shortsSpeedControlEnabledCheckbox) elements.shortsSpeedControlEnabledCheckbox.checked = items.shortsSpeedControlEnabled;
      if (elements.autoFullscreenCheckbox) elements.autoFullscreenCheckbox.checked = items.autoFullscreen;
      if (elements.autoScrollShortsCheckbox) elements.autoScrollShortsCheckbox.checked = items.autoScrollShorts;
      if (elements.enableAutoScrollCheckbox) elements.enableAutoScrollCheckbox.checked = items.enableAutoScroll;
    });
  }
  
  // Function to save settings
  function saveSettings() {
    const newSettings = {
      defaultSpeed: elements.defaultSpeedSelect?.value || '1',
      shortsSpeed: elements.shortsSpeedSelect?.value || '1',
      videoSpeedControlEnabled: elements.videoSpeedControlEnabledCheckbox?.checked || false,
      shortsSpeedControlEnabled: elements.shortsSpeedControlEnabledCheckbox?.checked || false,
      autoFullscreen: elements.autoFullscreenCheckbox?.checked || false,
      autoScrollShorts: elements.autoScrollShortsCheckbox?.checked || false,
      enableAutoScroll: elements.enableAutoScrollCheckbox?.checked || false
    };
    
    // Save to chrome storage
    chrome.storage.sync.set(newSettings, () => {
      // Show save confirmation
      const savedStatus = document.getElementById('saved-status');
      savedStatus.textContent = 'Настройки сохранены';
      savedStatus.style.display = 'block';
      
      // Hide after 1.5 seconds
      setTimeout(() => {
        savedStatus.style.display = 'none';
      }, 1500);
      
      // Send message to YouTube tabs with error handling
      sendSettingsToYouTubeTabs(newSettings);
    });
  }
  
  // Send settings to active YouTube tabs
  function sendSettingsToYouTubeTabs(settings) {
    try {
      chrome.tabs.query({url: '*://*.youtube.com/*'}, (tabs) => {
        if (chrome.runtime.lastError) {
          console.error('Error querying tabs:', chrome.runtime.lastError);
          return;
        }
        
        if (!tabs || tabs.length === 0) return;
        
        // Send message to each tab
        tabs.forEach((tab) => {
          chrome.tabs.sendMessage(tab.id, {
            action: 'settingsUpdated',
            settings: settings
          }, (response) => {
            // Ignore errors for unloaded tabs
            if (chrome.runtime.lastError) {
              console.log('Tab might be unloaded:', chrome.runtime.lastError.message);
            }
          });
        });
      });
    } catch (error) {
      console.error('Error sending settings to tabs:', error);
    }
  }
}); 