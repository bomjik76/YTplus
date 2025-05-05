// YouTube Speed Control - Injected Script
// Этот скрипт запускается в контексте страницы и имеет доступ к переменным YouTube

(function() {
  // Переменные состояния
  let speedControlEnabled = true;
  let videoOverridesApplied = new WeakMap();
  
  // Сразу проверяем существование видео
  const ensureVideoElement = function() {
    return document.querySelector('video');
  };
  
  // Скрываем уведомления YouTube о скорости
  function hideYouTubeNotifications() {
    // Создаем стиль для скрытия нотификаций
    const style = document.createElement('style');
    style.textContent = `
      /* Скрываем уведомления YouTube о скорости */
      .ytp-bezel-text-wrapper,
      .ytp-bezel-text,
      .ytp-bezel {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
      }
    `;
    document.head.appendChild(style);
    
    // Дополнительно будем удалять уведомления при их появлении
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length) {
          const bezels = document.querySelectorAll('.ytp-bezel-text-wrapper, .ytp-bezel-text, .ytp-bezel');
          bezels.forEach(node => {
            node.style.display = 'none';
            node.style.opacity = '0';
            node.style.visibility = 'hidden';
          });
        }
      }
    });
    
    // Наблюдаем за изменениями в DOM
    observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      attributes: false,
      characterData: false
    });
  }
  
  // Переопределяем функцию установки скорости в YouTube
  function overrideYouTubeSpeedControl() {
    try {
      // Используем MutationObserver для отслеживания появления видео элемента
      const observer = new MutationObserver((mutations) => {
        const videos = document.querySelectorAll('video');
        
        if (videos.length > 0) {
          // Применяем переопределение для каждого видео
          videos.forEach(overrideVideoPlaybackRate);
        }
      });
      
      // Наблюдаем за изменениями в DOM
      observer.observe(document.body, { 
        childList: true, 
        subtree: true,
        attributes: false,
        characterData: false
      });
      
      // Проверяем существуют ли видео на странице
      document.querySelectorAll('video').forEach(overrideVideoPlaybackRate);
    } catch (e) {
      console.error('Error overriding YouTube speed control:', e);
    }
  }
  
  // Переопределяем управление скоростью YouTube
  function overrideVideoPlaybackRate(video) {
    // Проверяем, не было ли уже переопределено свойство
    if (videoOverridesApplied.has(video)) return;
    
    try {
      // Отслеживаем прямые изменения скорости
      const originalPlaybackRateSetter = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'playbackRate').set;
      
      Object.defineProperty(video, 'playbackRate', {
        set: function(speed) {
          // Если Speed Control отключен, разрешаем только скорость 1.0
          if (!speedControlEnabled && speed !== 1.0) {
            originalPlaybackRateSetter.call(this, 1.0);
            return;
          }
          originalPlaybackRateSetter.call(this, speed);
        },
        get: function() {
          return Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'playbackRate').get.call(this);
        }
      });
      
      // Отмечаем, что переопределение уже применено
      videoOverridesApplied.set(video, true);
    } catch (e) {
      console.error('Error overriding video playback rate:', e);
    }
  }
  
  // Безопасный вызов функции
  const safeCall = (obj, method, ...args) => {
    if (obj && typeof obj[method] === 'function') {
      try {
        return obj[method](...args);
      } catch (e) {
        return null;
      }
    }
    return null;
  };
  
  // Инициализация расширения
  function init() {
    // Запускаем скрытие уведомлений
    hideYouTubeNotifications();
    
    // Переопределяем управление скоростью YouTube
    overrideYouTubeSpeedControl();
    
    // Настраиваем наблюдатель за новыми видео
    setupWatcher();
    
    // Сообщаем content script, что инжектированный скрипт готов
    window.postMessage({
      action: 'injectedScriptReady'
    }, '*');
    
    console.log('YouTube Speed Control: injected script running');
  }
  
  // Создаем интерфейс для доступа к API YouTube
  window.YTSpeedControl = {
    // Установка состояния контроля скорости
    setSpeedControlState: function(enabled) {
      speedControlEnabled = enabled;
      
      // Если Speed Control отключен, сразу устанавливаем нормальную скорость
      if (!enabled) {
        this.setPlaybackRate(1.0);
      }
      
      return true;
    },
    
    // Установка скорости воспроизведения через различные методы
    setPlaybackRate: function(speed) {
      try {
        // Если Speed Control отключен, разрешаем только нормальную скорость
        if (!speedControlEnabled && speed !== 1.0) {
          console.log('YTSpeedControl: Speed control is disabled, using normal speed');
          speed = 1.0;
        }
        
        // Применяем скорость ко всем видео на странице
        const videos = document.querySelectorAll('video');
        if (videos.length === 0) {
          console.error('YTSpeedControl: No video elements found');
          return false;
        }
        
        videos.forEach(video => {
          // Прямой доступ к видео элементу (работает всегда)
          video.playbackRate = speed;
        });
        
        // Пытаемся также обновить скорость через API
        this.updateSpeedThroughAPI(speed);
        
        // Обновляем состояние меню
        setTimeout(() => {
          this.updateSpeedMenuState(speed);
        }, 100);
        
        console.log('YTSpeedControl: Speed set to', speed, 'for all videos');
        
        // Скрываем уведомления о скорости
        setTimeout(() => {
          const bezels = document.querySelectorAll('.ytp-bezel-text-wrapper, .ytp-bezel-text, .ytp-bezel');
          bezels.forEach(node => {
            node.style.display = 'none';
            node.style.opacity = '0';
            node.style.visibility = 'hidden';
          });
        }, 10);
        
        return true;
      } catch (e) {
        console.error('YTSpeedControl: Error setting playback rate', e);
        return false;
      }
    },
    
    // Попытка обновить скорость через различные API YouTube
    updateSpeedThroughAPI: function(speed) {
      try {
        // Если Speed Control отключен, разрешаем только нормальную скорость
        if (!speedControlEnabled && speed !== 1.0) {
          speed = 1.0;
        }
        
        // Метод 1: Доступ через document.querySelector
        document.querySelectorAll('.html5-video-player')
          .forEach(player => safeCall(player, 'setPlaybackRate', speed));
        
        // Метод 2: Через movie_player
        const moviePlayer = document.getElementById('movie_player');
        if (moviePlayer) {
          safeCall(moviePlayer, 'setPlaybackRate', speed);
        }
        
        // Метод 3: Через API плеера
        if (window.yt && window.yt.player) {
          // Обходим все доступные игроки
          document.querySelectorAll('.html5-video-player').forEach(player => {
            if (player && player.id && window.yt.player[player.id]) {
              safeCall(window.yt.player[player.id], 'setPlaybackRate', speed);
            }
          });
        }
        
        return true;
      } catch (e) {
        console.error('YTSpeedControl: Error updating through API', e);
        return false;
      }
    },
    
    // Обновление состояния меню скорости
    updateSpeedMenuState: function(speed) {
      try {
        // Пытаемся найти кнопку настроек и нажать на неё, чтобы обновить UI
        const settingsButton = document.querySelector('.ytp-settings-button');
        if (settingsButton) {
          // Находим пункты меню, если они уже открыты
          const menuItems = document.querySelectorAll('.ytp-menuitem');
          if (menuItems.length > 0) {
            // Находим пункты меню скорости
            menuItems.forEach(item => {
              // Проверяем, содержит ли текст в пункте меню скорость
              const speedText = speed.toString();
              if (item.textContent.includes(speedText) && 
                  (item.textContent.includes('×') || item.textContent.includes('x'))) {
                
                // Добавляем активный класс
                item.setAttribute('aria-checked', 'true');
              } else if (item.textContent.includes('×') || item.textContent.includes('x')) {
                // Убираем активный класс с других пунктов
                item.setAttribute('aria-checked', 'false');
              }
            });
          }
        }
      } catch (e) {
        console.error('YTSpeedControl: Error updating menu state', e);
      }
    },
    
    // Получить текущую скорость из YouTube плеера
    getCurrentSpeed: function() {
      try {
        const video = ensureVideoElement();
        if (video) {
          return video.playbackRate;
        }
        return 1;
      } catch (e) {
        console.error('YTSpeedControl: Error getting current speed', e);
        return 1;
      }
    }
  };
  
  // Настраиваем обмен сообщениями с content script
  function setupWatcher() {
    window.addEventListener('message', function(event) {
      // Проверяем источник сообщения для безопасности
      if (event.source !== window) return;
      if (!event.data || !event.data.action) return;
      
      // Обрабатываем сообщения
      if (event.data.action === 'setPlaybackRate' && typeof event.data.speed !== 'undefined') {
        const success = window.YTSpeedControl.setPlaybackRate(event.data.speed);
        // Отправляем результат обратно в content script
        window.postMessage({
          action: 'setPlaybackRateResult',
          success: success,
          speed: event.data.speed
        }, '*');
      } else if (event.data.action === 'setSpeedControlState' && typeof event.data.enabled !== 'undefined') {
        const success = window.YTSpeedControl.setSpeedControlState(event.data.enabled);
        // Отправляем результат обратно в content script
        window.postMessage({
          action: 'setSpeedControlStateResult',
          success: success,
          enabled: event.data.enabled
        }, '*');
      }
    });
    
    // Создаем MutationObserver для отслеживания появления новых видео
    const observer = new MutationObserver((mutations) => {
      // Проверяем, есть ли видео на странице
      const videos = document.querySelectorAll('video');
      if (videos.length > 0) {
        // Если есть новые видео, проверяем текущую скорость и применяем её
        if (videos[0] && speedControlEnabled) {
          const currentSpeed = videos[0].playbackRate;
          videos.forEach(video => {
            if (video.playbackRate !== currentSpeed) {
              video.playbackRate = currentSpeed;
            }
          });
        }
      }
    });
    
    // Наблюдаем за изменениями в DOM
    observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      attributes: false,
      characterData: false
    });
  }
  
  // Запускаем инициализацию
  init();
})(); 