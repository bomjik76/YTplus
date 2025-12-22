// ------------------------------
// CONSTANT SELECTORS VARIABLES
// ------------------------------
const VIDEOS_LIST_SELECTORS = [
    ".reel-video-in-sequence",
    ".reel-video-in-sequence-new",
];
const CURRENT_SHORT_SELECTOR = "ytd-reel-video-renderer";
const NEXT_BUTTON_SELECTOR = "#navigation-button-down > ytd-button-renderer > yt-button-shape > button";
const PREVIOUS_BUTTON_SELECTOR = "#navigation-button-up > ytd-button-renderer > yt-button-shape > button";
// ------------------------------
// APP VARIABLES
// ------------------------------
let shortCutToggleKeys = [];
let scrollDirection = 1;
let amountOfPlays = 0;
let amountOfPlaysToSkip = 1;
let currentShortId = null;
let currentVideoElement = null;
let applicationIsOn = false;
let scrollTimeout;
const MAX_RETRIES = 15;
const RETRY_DELAY_MS = 500;
// ------------------------------
// SHORTS SPEED TOGGLE FEATURE
// ------------------------------
let shortsSpeedState = 1; // 1x или выбранная скорость
let selectedSpeed = 2; // скорость для ускорения по умолчанию
let speedOverlay = null;
let speedToggleButton = null;
const SPEED_OPTIONS = [1.2, 1.5, 1.7, 2, 2.5];
const SPEED_TOGGLE_SHORTCUT = ['shift', 's']; // Hardcoded for now
let pressedKeys = [];
// ------------------------------
// NORMAL VIDEO SPEED TOGGLE FEATURE
// ------------------------------
let normalVideoSpeedState = 1; // 1x или выбранная скорость
let normalSelectedSpeed = 2; // скорость для ускорения по умолчанию
let normalSpeedOverlay = null;
const NORMAL_SPEED_OPTIONS = [1.2, 1.5, 1.7, 2, 2.5];
// ------------------------------
// MAIN FUNCTIONS
// ------------------------------
function startAutoScrolling() {
    if (!applicationIsOn) {
        applicationIsOn = true;
        amountOfPlays = 0;
        currentShortId = null;
        currentVideoElement = null;
    }
    checkForNewShort();
}
function stopAutoScrolling() {
    applicationIsOn = false;
    if (scrollTimeout) {
        clearTimeout(scrollTimeout);
    }
    if (currentVideoElement) {
        currentVideoElement.removeEventListener("ended", shortEnded);
        currentVideoElement._hasEndEvent = false;
    }
    // Удаляем UI скорости при остановке
    if (!isShortsPage()) {
        removeSpeedUI();
    }
}
async function checkForNewShort() {
    // Удаляем кнопку, если не на странице Shorts
    if (!isShortsPage()) {
        removeSpeedUI();
        return;
    }
    if (!applicationIsOn)
        return;
    const currentShort = findShortContainer();
    if (!currentShort)
        return;
    if (currentShort?.id != currentShortId) {
        if (scrollTimeout)
            clearTimeout(scrollTimeout);
        const previousShort = currentVideoElement;
        if (previousShort) {
            previousShort.removeEventListener("ended", shortEnded);
            previousShort._hasEndEvent = false;
        }
        currentShortId = parseInt(currentShort.id);
        currentVideoElement = currentShort.querySelector("video");
        if (currentVideoElement == null) {
            let l = 0;
            while (currentVideoElement == null) {
                currentVideoElement = currentShort.querySelector("video");
                if (l > MAX_RETRIES) {
                    let prevShortId = currentShortId;
                    currentShortId = null;
                    console.log("[YT+] Video element not found, scrolling to next short...");
                    return scrollToNextShort(prevShortId);
                }
                await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
                l++;
            }
        }
        console.log("[YT+] Current ID of Short: ", currentShortId);
        console.log("[YT+] Adding event listener to video element...");
        currentVideoElement.addEventListener("ended", shortEnded);
        currentVideoElement._hasEndEvent = true;
    }
    if (currentVideoElement?.hasAttribute("loop") && applicationIsOn) {
        currentVideoElement.removeAttribute("loop");
    }
    if (isShortsPage() && currentVideoElement) {
        setShortsPlaybackSpeed(shortsSpeedState);
        injectSpeedToggleButton();
    } else {
        // Удаляем кнопку, если не на странице Shorts или нет видео элемента
        removeSpeedUI();
    }
}
function shortEnded(e) {
    e.preventDefault();
    if (!applicationIsOn)
        return stopAutoScrolling();
    console.log("[YT+] Short ended, scrolling to next short...");
    amountOfPlays++;
    if (amountOfPlays >= amountOfPlaysToSkip) {
        amountOfPlays = 0;
        scrollToNextShort(currentShortId);
    } else {
        currentVideoElement.play();
    }
}
async function scrollToNextShort(prevShortId = null) {
    if (!applicationIsOn)
        return stopAutoScrolling();
    if (scrollTimeout)
        clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(async () => {
        if (prevShortId != null && currentShortId != prevShortId)
            return;
        const nextShortContainer = await waitForNextShort();
        if (nextShortContainer == null && isShortsPage())
            return window.location.reload();
        if (currentVideoElement) {
            currentVideoElement.removeEventListener("ended", shortEnded);
            currentVideoElement._hasEndEvent = false;
        }
        nextShortContainer.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "start",
        });
        checkForNewShort();
    }, 0);
}
function findShortContainer(id = null) {
    let shorts = [];
    for (let i = 0; i < VIDEOS_LIST_SELECTORS.length; i++) {
        const shortList = [
            ...document.querySelectorAll(VIDEOS_LIST_SELECTORS[i]),
        ];
        if (shortList.length > 0) {
            shorts = [...shortList];
            break;
        }
    }
    if (id != null) {
        if (shorts.length === 0)
            return document.getElementById(id);
        const short = shorts.find((short) => short.id == id.toString());
        if (short)
            return short;
    }
    if (shorts.length === 0)
        return document.getElementById(currentShortId || 0);
    return id > 1
        ? shorts[id]
        : (shorts.find((short) => 
            short.hasAttribute("is-active") ||
            short.querySelector(CURRENT_SHORT_SELECTOR) ||
            short.querySelector("[is-active]")) ||
            shorts[0]);
}
async function waitForNextShort(retries = 5, delay = 500) {
    if (!isShortsPage())
        return null;
    for (let i = 0; i < retries; i++) {
        const nextShort = findShortContainer(currentShortId + scrollDirection);
        if (nextShort)
            return nextShort;
        window.scrollBy(0, 100);
        await new Promise((r) => setTimeout(r, delay));
        window.scrollBy(0, -100);
        await new Promise((r) => setTimeout(r, delay));
    }
    console.log("[YT+] The next short has not loaded in, reloading page...");
    return null;
}
function isShortsPage() {
    // Проверяем URL - страница Shorts должна содержать /shorts/
    const url = window.location.href;
    if (!url.includes('/shorts/')) {
        return false;
    }
    // Дополнительная проверка наличия элементов Shorts на странице
    let containsShortElements = false;
    for (let i = 0; i < VIDEOS_LIST_SELECTORS.length; i++) {
        const doesPageHaveAShort = document.querySelector(VIDEOS_LIST_SELECTORS[i]);
        if (doesPageHaveAShort) {
            containsShortElements = true;
            break;
        }
    }
    return containsShortElements;
}
// ------------------------------
// INITIATION AND SETTINGS FETCH
// ------------------------------
(function initiate() {
    chrome.storage.local.get(["applicationIsOn"], (result) => {
        if (result["applicationIsOn"] == null)
            return startAutoScrolling();
        if (result["applicationIsOn"])
            startAutoScrolling();
    });
    checkForNewShort();
    checkApplicationState();
    setInterval(checkForNewShort, RETRY_DELAY_MS);
    // Проверка при загрузке страницы - удаляем кнопку, если не на странице Shorts
    if (!isShortsPage()) {
        removeSpeedUI();
    }
    // Отслеживание изменений URL для удаления кнопки при переходе на другую страницу
    let lastUrl = location.href;
    const urlObserver = new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            // Небольшая задержка для проверки после изменения URL
            setTimeout(() => {
                if (!isShortsPage()) {
                    removeSpeedUI();
                }
            }, 100);
        }
    });
    urlObserver.observe(document, { subtree: true, childList: true });
    
    // Также отслеживаем события popstate (навигация браузера)
    window.addEventListener('popstate', () => {
        setTimeout(() => {
            if (!isShortsPage()) {
                removeSpeedUI();
            }
        }, 100);
    });
    function checkApplicationState() {
        chrome.storage.local.get(["applicationIsOn"], (result) => {
            if (applicationIsOn && result["applicationIsOn"] === false) {
                stopAutoScrolling();
            }
            else if (result["applicationIsOn"] === true) {
                startAutoScrolling();
            }
        });
    }
    (function onApplicationChange() {
        chrome.storage.local.onChanged.addListener((changes) => {
            if (changes["applicationIsOn"]?.newValue) {
                startAutoScrolling();
            }
            else if (changes["applicationIsOn"]?.newValue === false) {
                stopAutoScrolling();
            }
        });
    })();
    (function getAllSettings() {
        chrome.storage.local.get([
            "shortCutKeys",
            "scrollDirection",
            "amountOfPlaysToSkip",
            "shortsSelectedSpeed"
        ], (result) => {
            console.log("[YT+]", {
                AutoYTScrollerSettings: result,
            });
            if (result["shortCutKeys"])
                shortCutToggleKeys = [...result["shortCutKeys"]];
            if (result["scrollDirection"]) {
                if (result["scrollDirection"] === "up")
                    scrollDirection = -1;
                else
                    scrollDirection = 1;
            }
            if (result["amountOfPlaysToSkip"])
                amountOfPlaysToSkip = result["amountOfPlaysToSkip"];
            if (result["shortsSelectedSpeed"])
                selectedSpeed = result["shortsSelectedSpeed"];
            shortCutListener();
        });
        chrome.storage.onChanged.addListener((result) => {
            let newShortCutKeys = result["shortCutKeys"]?.newValue;
            if (newShortCutKeys != undefined) {
                shortCutToggleKeys = [...newShortCutKeys];
            }
            let newScrollDirection = result["scrollDirection"]?.newValue;
            if (newScrollDirection != undefined) {
                if (newScrollDirection === "up")
                    scrollDirection = -1;
                else
                    scrollDirection = 1;
            }
            let newAmountOfPlaysToSkip = result["amountOfPlaysToSkip"]?.newValue;
            if (newAmountOfPlaysToSkip) {
                amountOfPlaysToSkip = newAmountOfPlaysToSkip;
            }
            let newShortsSelectedSpeed = result["shortsSelectedSpeed"]?.newValue;
            if (newShortsSelectedSpeed != undefined) {
                selectedSpeed = newShortsSelectedSpeed;
                // Если ускорение активно, сразу применить новую скорость
                if (shortsSpeedState !== 1 && currentVideoElement) {
                    setShortsPlaybackSpeed(selectedSpeed);
                }
                // Обновить текст кнопки
                if (speedToggleButton) {
                    speedToggleButton.textContent = `⏩ ${selectedSpeed}x`;
                }
            }
        });
    })();
})();
function shortCutListener() {
    document.addEventListener("keydown", async (e) => {
        if (!e.key)
            return;
        pressedKeys.push(e.key.toLowerCase());
        if (await checkKeys(shortCutToggleKeys)) {
            if (applicationIsOn) {
                stopAutoScrolling();
                chrome.storage.local.set({
                    applicationIsOn: false,
                });
            }
            else {
                startAutoScrolling();
                chrome.storage.local.set({
                    applicationIsOn: true,
                });
            }
        }
        pressedKeys = [];
    });
}
async function checkKeys(keys, exact = true) {
    if (!keys || keys.length === 0)
        return false;
    const pressedKeysStr = pressedKeys.join("+");
    const keysStr = keys.join("+");
    if (exact) {
        return pressedKeysStr === keysStr;
    }
    return keys.every((key) => pressedKeys.includes(key));
}
function setShortsPlaybackSpeed(speed) {
    if (currentVideoElement) {
        currentVideoElement.playbackRate = speed;
        shortsSpeedState = speed;
        showSpeedOverlay(speed);
        updateSpeedToggleButton(speed);
    }
}
function toggleShortsPlaybackSpeed() {
    if (!currentVideoElement) return;
    const newSpeed = shortsSpeedState === 1 ? selectedSpeed : 1;
    setShortsPlaybackSpeed(newSpeed);
}
function showSpeedOverlay(speed) {
    if (!speedOverlay) {
        speedOverlay = document.createElement('div');
        speedOverlay.style.position = 'fixed';
        speedOverlay.style.top = '80px';
        speedOverlay.style.right = '40px';
        speedOverlay.style.zIndex = '9999';
        speedOverlay.style.color = '#fff';
        speedOverlay.style.fontWeight = 'bold';
        speedOverlay.style.fontSize = '18px';
        speedOverlay.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
        speedOverlay.style.transition = 'opacity 0.3s';
        speedOverlay.style.pointerEvents = 'none';
        speedOverlay.style.display = 'flex';
        speedOverlay.style.alignItems = 'center';
        speedOverlay.style.justifyContent = 'center';
        document.body.appendChild(speedOverlay);
    }
    speedOverlay.textContent = speed + 'x';
    if (speed !== 1) {
        speedOverlay.style.background = 'rgb(255, 0, 51)';
        speedOverlay.style.borderRadius = '50%';
        speedOverlay.style.width = '48px';
        speedOverlay.style.height = '48px';
        speedOverlay.style.padding = '0';
    } else {
        speedOverlay.style.background = 'rgba(0,0,0,0.7)';
        speedOverlay.style.borderRadius = '20px';
        speedOverlay.style.width = 'auto';
        speedOverlay.style.height = 'auto';
        speedOverlay.style.padding = '6px 14px';
    }
    speedOverlay.style.opacity = '1';
    clearTimeout(speedOverlay._hideTimeout);
    speedOverlay._hideTimeout = setTimeout(() => {
        if (speedOverlay) speedOverlay.style.opacity = '0';
    }, 1200);
}
function createSpeedToggleButton() {
    if (speedToggleButton) return;
    speedToggleButton = document.createElement('button');
    speedToggleButton.textContent = `⏩ ${selectedSpeed}x`;
    speedToggleButton.title = 'Toggle Shorts Speed (1x/выбранная)';
    speedToggleButton.style.position = 'fixed';
    speedToggleButton.style.top = '150px';
    speedToggleButton.style.right = '40px';
    speedToggleButton.style.zIndex = '9999';
    speedToggleButton.style.background = 'rgba(0,0,0,0.7)';
    speedToggleButton.style.color = '#fff';
    speedToggleButton.style.border = 'none';
    speedToggleButton.style.borderRadius = '50%';
    speedToggleButton.style.width = '60px';
    speedToggleButton.style.height = '40px';
    speedToggleButton.style.fontSize = '16px';
    speedToggleButton.style.cursor = 'pointer';
    speedToggleButton.style.display = 'flex';
    speedToggleButton.style.alignItems = 'center';
    speedToggleButton.style.justifyContent = 'center';
    speedToggleButton.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
    speedToggleButton.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleShortsPlaybackSpeed();
    });
}
function updateSpeedToggleButton(speed) {
    if (!speedToggleButton) return;
    speedToggleButton.style.background = 'rgba(0,0,0,0.7)';
    speedToggleButton.title = `Текущая: ${speed}x. Клик — переключить.`;
    speedToggleButton.textContent = `⏩ ${selectedSpeed}x`;
}
function injectSpeedToggleButton() {
    if (!currentVideoElement) return;
    createSpeedToggleButton();
    // Всегда добавляем кнопку в body, чтобы она была зафиксирована на экране
    if (!document.body.contains(speedToggleButton)) {
        document.body.appendChild(speedToggleButton);
    }
    updateSpeedToggleButton(shortsSpeedState);
}
function removeSpeedUI() {
    if (speedOverlay && speedOverlay.parentNode) speedOverlay.parentNode.removeChild(speedOverlay);
    speedOverlay = null;
    if (speedToggleButton && speedToggleButton.parentNode) speedToggleButton.parentNode.removeChild(speedToggleButton);
    speedToggleButton = null;
}
// Listen for Shift+S
(function shortsSpeedShortcutListener() {
    document.addEventListener('keydown', function(e) {
        // Поддержка Shift+S (англ) и Shift+ы (рус)
        if (e.shiftKey && (e.key === 'S' || e.key === 's' || e.key === 'ы' || e.key === 'Ы')) {
            if (isShortsPage() && currentVideoElement) {
                e.preventDefault();
                toggleShortsPlaybackSpeed();
            }
        }
    });
})();
// Listen for D/В (вниз) и E/У (вверх) для прокрутки Shorts
(function shortsScrollKeyListener() {
    document.addEventListener('keydown', function(e) {
        if (!isShortsPage() || !currentVideoElement) return;
        // D (англ) или В (рус) — вниз (следующий)
        if (e.key === 'd' || e.key === 'D' || e.key === 'в' || e.key === 'В') {
            e.preventDefault();
            scrollDirection = 1;
            scrollToNextShort(currentShortId);
        }
        // E (англ) или У (рус) — вверх (предыдущий)
        if (e.key === 'e' || e.key === 'E' || e.key === 'у' || e.key === 'У') {
            e.preventDefault();
            scrollDirection = -1;
            scrollToNextShort(currentShortId);
        }
    });
})();

// ------------------------------
// NORMAL VIDEO SPEED TOGGLE FEATURE
// ------------------------------
function setNormalVideoPlaybackSpeed(speed) {
    const video = document.querySelector('video');
    if (video) {
        video.playbackRate = speed;
        normalVideoSpeedState = speed;
        showNormalSpeedOverlay(speed);
    }
}

function toggleNormalVideoPlaybackSpeed() {
    const video = document.querySelector('video');
    if (!video) return;
    if (normalVideoSpeedState === 1) {
        setNormalVideoPlaybackSpeed(normalSelectedSpeed);
    } else {
        setNormalVideoPlaybackSpeed(1);
    }
}

function showNormalSpeedOverlay(speed) {
    if (!normalSpeedOverlay) {
        normalSpeedOverlay = document.createElement('div');
        normalSpeedOverlay.style.position = 'fixed';
        normalSpeedOverlay.style.top = '80px';
        normalSpeedOverlay.style.left = '40px';
        normalSpeedOverlay.style.zIndex = '9999';
        normalSpeedOverlay.style.color = '#fff';
        normalSpeedOverlay.style.fontWeight = 'bold';
        normalSpeedOverlay.style.fontSize = '18px';
        normalSpeedOverlay.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
        normalSpeedOverlay.style.transition = 'opacity 0.3s';
        normalSpeedOverlay.style.pointerEvents = 'none';
        normalSpeedOverlay.style.display = 'flex';
        normalSpeedOverlay.style.alignItems = 'center';
        normalSpeedOverlay.style.justifyContent = 'center';
        document.body.appendChild(normalSpeedOverlay);
    }
    normalSpeedOverlay.textContent = speed + 'x';
    if (speed !== 1) {
        normalSpeedOverlay.style.background = 'rgb(255, 0, 51)';
        normalSpeedOverlay.style.borderRadius = '50%';
        normalSpeedOverlay.style.width = '48px';
        normalSpeedOverlay.style.height = '48px';
        normalSpeedOverlay.style.padding = '0';
    } else {
        normalSpeedOverlay.style.background = 'rgba(0,0,0,0.7)';
        normalSpeedOverlay.style.borderRadius = '20px';
        normalSpeedOverlay.style.width = 'auto';
        normalSpeedOverlay.style.height = 'auto';
        normalSpeedOverlay.style.padding = '6px 14px';
    }
    normalSpeedOverlay.style.opacity = '1';
    clearTimeout(normalSpeedOverlay._hideTimeout);
    normalSpeedOverlay._hideTimeout = setTimeout(() => {
        if (normalSpeedOverlay) normalSpeedOverlay.style.opacity = '0';
    }, 1200);
}
// Listen for Shift+S for normal videos
(function normalVideoSpeedShortcutListener() {
    document.addEventListener('keydown', function(e) {
        // Поддержка Shift+S (англ) и Shift+ы (рус)
        if (e.shiftKey && (e.key === 'S' || e.key === 's' || e.key === 'ы' || e.key === 'Ы')) {
            if (!isShortsPage()) {
                const video = document.querySelector('video');
                if (video) {
                    e.preventDefault();
                    toggleNormalVideoPlaybackSpeed();
                }
            }
        }
    });
})();

// ------------------------------
// PROGRESS BAR CUSTOMIZATION FEATURE
// ------------------------------
let progressBarStyle = null;
let progressBarColors = {
    progressColor: '#ff0000',      // Цвет заполненной части прогресс-бара
    scrubberColor: '#ff0000',      // Цвет точки воспроизведения
    scrubberImage: null,           // Изображение для точки воспроизведения (base64)
    scrubberImageSize: 40,         // Размер изображения в пикселях (20-150)
    scrubberType: 'color',         // Тип точки воспроизведения: 'color' или 'image'
    bufferColor: '#ffffff',        // Цвет буфера (с прозрачностью в CSS)
    enabled: true
};

// Функция для создания и применения стилей прогресс-бара
function applyProgressBarStyles() {
    // Удаляем старые стили, если они есть
    if (progressBarStyle && progressBarStyle.parentNode) {
        progressBarStyle.parentNode.removeChild(progressBarStyle);
    }

    if (!progressBarColors.enabled) {
        return;
    }

    // Создаем новый элемент style
    progressBarStyle = document.createElement('style');
    progressBarStyle.id = 'ytplus-progress-bar-styles';
    
    const css = `
        /* Стилизация прогресс-бара YouTube */
        .ytp-progress-bar-container,
        .ytp-progress-bar {
            background: transparent !important;
        }
        
        /* Заполненная часть прогресс-бара (прогресс воспроизведения) */
        .ytp-play-progress,
        .ytp-play-progress.ytp-swatch-background-color {
            background: ${progressBarColors.progressColor} !important;
            background-color: ${progressBarColors.progressColor} !important;
        }
        
        /* Точка воспроизведения (ползунок) */
        .ytp-scrubber-button,
        .ytp-scrubber-button.ytp-swatch-background-color {
            ${getScrubberStyles()}
        }
        
        /* Внутренний круг точки воспроизведения */
        .ytp-scrubber-button::before {
            ${progressBarColors.scrubberType === 'image' && progressBarColors.scrubberImage
                ? 'background: transparent !important;'
                : `background: ${progressBarColors.scrubberColor} !important;`}
        }
        
        /* Буфер (загруженная часть) */
        .ytp-load-progress,
        .ytp-load-progress div {
            background: ${hexToRgba(progressBarColors.bufferColor, 0.2)} !important;
        }
        
        /* Для Shorts */
        .reel-player-overlay .ytp-progress-bar-container .ytp-play-progress,
        .reel-player-overlay .ytp-progress-bar-container .ytp-scrubber-button {
            background: ${progressBarColors.progressColor} !important;
            background-color: ${progressBarColors.progressColor} !important;
        }
        
        .reel-player-overlay .ytp-scrubber-button {
            ${getScrubberStyles()}
        }
    `;
    
    progressBarStyle.textContent = css;
    document.head.appendChild(progressBarStyle);
}

// Функция для конвертации hex в rgba
function hexToRgba(hex, alpha = 1) {
    // Удаляем # если есть
    hex = hex.replace('#', '');
    
    // Поддержка короткого формата (#fff -> #ffffff)
    if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
    }
    
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Функция для получения стилей точки воспроизведения
function getScrubberStyles() {
    if (progressBarColors.scrubberType === 'image' && progressBarColors.scrubberImage) {
        const imageSize = progressBarColors.scrubberImageSize || 40;
        return `background-image: url("${progressBarColors.scrubberImage}") !important;
                background-size: ${imageSize}px ${imageSize}px !important;
                background-repeat: no-repeat !important;
                background-position: center !important;
                background-color: transparent !important;
                border: none !important;
                width: ${imageSize}px !important;
                height: ${imageSize}px !important;
                min-width: ${imageSize}px !important;
                min-height: ${imageSize}px !important;
                box-sizing: content-box !important;`;
    } else {
        return `background: ${progressBarColors.scrubberColor} !important;
                background-color: ${progressBarColors.scrubberColor} !important;
                border-color: ${progressBarColors.scrubberColor} !important;`;
    }
}

// Функция для обновления цветов прогресс-бара
function updateProgressBarColors(colors) {
    progressBarColors = { ...progressBarColors, ...colors };
    applyProgressBarStyles();
}

// Инициализация стилей прогресс-бара
(function initProgressBarStyles() {
    // Загружаем настройки из storage
    chrome.storage.local.get(['progressBarColors'], (result) => {
        if (result.progressBarColors) {
            progressBarColors = { ...progressBarColors, ...result.progressBarColors };
        }
        applyProgressBarStyles();
    });

    // Слушаем изменения настроек
    chrome.storage.onChanged.addListener((changes) => {
        if (changes.progressBarColors) {
            progressBarColors = { ...progressBarColors, ...changes.progressBarColors.newValue };
            applyProgressBarStyles();
        }
    });

    // Применяем стили при загрузке страницы и при изменении DOM (для динамического контента YouTube)
    const observer = new MutationObserver(() => {
        if (progressBarColors.enabled && (!progressBarStyle || !document.head.contains(progressBarStyle))) {
            applyProgressBarStyles();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Применяем стили сразу
    applyProgressBarStyles();
})();
