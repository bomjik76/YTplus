// YouTube Speed Control - Background Script
// Этот скрипт обрабатывает миграцию настроек с предыдущей версии

// Обработка установки или обновления расширения
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'update' || details.reason === 'install') {
    // Миграция настроек с предыдущей версии
    migrateSettings();
  }
});

// Функция миграции настроек
function migrateSettings() {
  chrome.storage.sync.get({
    defaultSpeed: '1',
    shortsSpeed: '1',
    speedControlEnabled: true,  // старая настройка
    autoFullscreen: true,
    autoScrollShorts: false
  }, (oldSettings) => {
    // Проверяем, есть ли старая настройка speedControlEnabled
    if ('speedControlEnabled' in oldSettings) {
      console.log('Migrating settings from previous version');
      
      // Новые настройки на основе старых
      const newSettings = {
        defaultSpeed: oldSettings.defaultSpeed,
        shortsSpeed: oldSettings.shortsSpeed,
        videoSpeedControlEnabled: oldSettings.speedControlEnabled,
        shortsSpeedControlEnabled: oldSettings.speedControlEnabled,
        autoFullscreen: oldSettings.autoFullscreen,
        autoScrollShorts: oldSettings.autoScrollShorts
      };
      
      // Сохраняем новые настройки
      chrome.storage.sync.set(newSettings, () => {
        console.log('Settings migration completed');
      });
    } else {
      console.log('No settings migration needed');
    }
  });
} 