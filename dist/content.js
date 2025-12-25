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
let shortsSpeedEnabled = true; // Включена ли функция ускорения для Shorts
let shortsSpeedState = 1; // 1x или выбранная скорость
let selectedSpeed = 2; // скорость для ускорения по умолчанию
let speedOverlay = null;
let speedToggleButton = null;
let speedToggleButtonContainer = null;
const SPEED_OPTIONS = [1.2, 1.5, 1.7, 2, 2.5];
let shortsSpeedShortcut = ['shift', 's']; // Настраиваемая комбинация клавиш
let shortsScrollEnabled = true; // Включена ли функция прокрутки Shorts
let shortsScrollDownShortcut = ['d']; // Комбинация для прокрутки вниз (следующий Short)
let shortsScrollUpShortcut = ['e']; // Комбинация для прокрутки вверх (предыдущий Short)
let pressedKeys = [];
// ------------------------------
// NORMAL VIDEO SPEED TOGGLE FEATURE
// ------------------------------
let normalVideoSpeedEnabled = true; // Включена ли функция ускорения для обычных видео
let normalVideoSpeedState = 1; // 1x или выбранная скорость
let normalSelectedSpeed = 2; // скорость для ускорения по умолчанию
let normalSpeedOverlay = null;
const NORMAL_SPEED_OPTIONS = [1.2, 1.5, 1.7, 2, 2.5];
let normalVideoSpeedShortcut = ['shift', 's']; // Настраиваемая комбинация клавиш для обычных видео
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
        // Применяем скорость только если функция включена
        if (shortsSpeedEnabled) {
            setShortsPlaybackSpeed(shortsSpeedState);
            injectSpeedToggleButton();
        } else {
            // Если функция выключена, сбрасываем скорость на 1x и скрываем кнопку
            if (shortsSpeedState !== 1) {
                currentVideoElement.playbackRate = 1;
                shortsSpeedState = 1;
            }
            removeSpeedUI();
        }
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
    
    // Используем MutationObserver для отслеживания новых Shorts (как в оригинальном расширении)
    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // It's an element
                        if (node.matches && node.matches('ytd-reel-video-renderer')) {
                            // Небольшая задержка для гарантии, что DOM готов
                            setTimeout(() => injectSpeedToggleButton(), 100);
                        }
                        if (node.querySelectorAll) {
                            node.querySelectorAll('ytd-reel-video-renderer').forEach(() => {
                                setTimeout(() => injectSpeedToggleButton(), 100);
                            });
                        }
                    }
                });
            }
        }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Пробуем добавить кнопку к уже существующим Shorts
    document.querySelectorAll('ytd-reel-video-renderer').forEach(() => {
        setTimeout(() => injectSpeedToggleButton(), 100);
    });
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
            "shortsSpeedEnabled",
            "shortsSelectedSpeed",
            "shortsSpeedShortcut",
            "shortsScrollEnabled",
            "shortsScrollDownShortcut",
            "shortsScrollUpShortcut",
            "normalVideoSpeedEnabled",
            "normalVideoSpeedShortcut"
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
            if (result["shortsSpeedEnabled"] !== undefined)
                shortsSpeedEnabled = result["shortsSpeedEnabled"];
            if (result["shortsSelectedSpeed"])
                selectedSpeed = result["shortsSelectedSpeed"];
            if (result["shortsSpeedShortcut"])
                shortsSpeedShortcut = result["shortsSpeedShortcut"];
            if (result["shortsScrollEnabled"] !== undefined)
                shortsScrollEnabled = result["shortsScrollEnabled"];
            if (result["shortsScrollDownShortcut"])
                shortsScrollDownShortcut = result["shortsScrollDownShortcut"];
            if (result["shortsScrollUpShortcut"])
                shortsScrollUpShortcut = result["shortsScrollUpShortcut"];
            if (result["normalVideoSpeedEnabled"] !== undefined)
                normalVideoSpeedEnabled = result["normalVideoSpeedEnabled"];
            if (result["normalVideoSpeedShortcut"])
                normalVideoSpeedShortcut = result["normalVideoSpeedShortcut"];
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
                if (speedToggleButtonContainer) {
                    const speedText = speedToggleButtonContainer.querySelector('#ytplus-speed-text');
                    if (speedText) {
                        speedText.textContent = `${selectedSpeed}x`;
                    }
                }
            }
            let newShortsSpeedEnabled = result["shortsSpeedEnabled"]?.newValue;
            if (newShortsSpeedEnabled !== undefined) {
                shortsSpeedEnabled = newShortsSpeedEnabled;
                // Если функция выключена, сбрасываем скорость на 1x
                if (!shortsSpeedEnabled && currentVideoElement && shortsSpeedState !== 1) {
                    setShortsPlaybackSpeed(1);
                }
            }
            let newShortsSpeedShortcut = result["shortsSpeedShortcut"]?.newValue;
            if (newShortsSpeedShortcut != undefined) {
                shortsSpeedShortcut = newShortsSpeedShortcut;
            }
            let newShortsScrollEnabled = result["shortsScrollEnabled"]?.newValue;
            if (newShortsScrollEnabled !== undefined) {
                shortsScrollEnabled = newShortsScrollEnabled;
            }
            let newShortsScrollDownShortcut = result["shortsScrollDownShortcut"]?.newValue;
            if (newShortsScrollDownShortcut != undefined) {
                shortsScrollDownShortcut = newShortsScrollDownShortcut;
            }
            let newShortsScrollUpShortcut = result["shortsScrollUpShortcut"]?.newValue;
            if (newShortsScrollUpShortcut != undefined) {
                shortsScrollUpShortcut = newShortsScrollUpShortcut;
            }
            let newNormalVideoSpeedEnabled = result["normalVideoSpeedEnabled"]?.newValue;
            if (newNormalVideoSpeedEnabled !== undefined) {
                normalVideoSpeedEnabled = newNormalVideoSpeedEnabled;
                // Если функция выключена, сбрасываем скорость на 1x
                if (!normalVideoSpeedEnabled) {
                    const video = document.querySelector('video');
                    if (video && normalVideoSpeedState !== 1) {
                        setNormalVideoPlaybackSpeed(1);
                    }
                }
            }
            let newNormalVideoSpeedShortcut = result["normalVideoSpeedShortcut"]?.newValue;
            if (newNormalVideoSpeedShortcut != undefined) {
                normalVideoSpeedShortcut = newNormalVideoSpeedShortcut;
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
    // Проверяем, включена ли функция ускорения
    if (!shortsSpeedEnabled) return;
    const newSpeed = shortsSpeedState === 1 ? selectedSpeed : 1;
    setShortsPlaybackSpeed(newSpeed);
}
function showSpeedOverlay(speed) {
    // Находим контейнер действий для размещения overlay
    const activeShort = document.querySelector('ytd-reel-video-renderer[is-active]');
    if (!activeShort) return;
    
    const actionsContainer = activeShort.querySelector('ytd-reel-player-overlay-renderer #actions');
    if (!actionsContainer) return;
    
    if (!speedOverlay) {
        // Создаём контейнер для overlay (как у кнопок YouTube)
        speedOverlay = document.createElement('div');
        speedOverlay.className = 'ytplus-speed-overlay';
        speedOverlay.style.cssText = 'display: flex; flex-direction: column; align-items: center; gap: 4px; margin: 8px 0;';
        
        // Создаём кнопку-индикатор в стиле YouTube
        const overlayButton = document.createElement('button');
        overlayButton.className = 'yt-spec-button-shape-next yt-spec-button-shape-next--tonal yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-m yt-spec-button-shape-next--icon-button';
        overlayButton.style.cssText = 'width: 48px; height: 48px; border-radius: 50%; padding: 0; margin: 0; display: flex; align-items: center; justify-content: center; pointer-events: none;';
        overlayButton.id = 'ytplus-speed-overlay-button';
        
        // Создаём текст внутри кнопки
        const overlayText = document.createElement('div');
        overlayText.className = 'yt-spec-button-shape-next__icon';
        overlayText.style.cssText = 'width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 500;';
        overlayText.id = 'ytplus-speed-overlay-text';
        
        overlayButton.appendChild(overlayText);
        speedOverlay.appendChild(overlayButton);
        
        // Добавляем overlay в контейнер действий, если его там ещё нет
        if (!actionsContainer.contains(speedOverlay)) {
            // Вставляем перед кнопкой скорости, если она есть
            const speedButton = actionsContainer.querySelector('.ytplus-speed-button');
            if (speedButton) {
                actionsContainer.insertBefore(speedOverlay, speedButton);
            } else {
                // Если кнопки нет, вставляем в начало
                actionsContainer.prepend(speedOverlay);
            }
        }
    }
    
    const overlayText = speedOverlay.querySelector('#ytplus-speed-overlay-text');
    const overlayButton = speedOverlay.querySelector('#ytplus-speed-overlay-button');
    
    if (overlayText) {
        overlayText.textContent = speed + 'x';
    }
    
    // Обновляем стиль в зависимости от состояния
    if (speed !== 1) {
        // Активное состояние - подсвечиваем
        if (overlayText) {
            overlayText.style.color = '#3ea6ff';
        }
        if (overlayButton) {
            overlayButton.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
        }
    } else {
        // Неактивное состояние - стандартный цвет
        if (overlayText) {
            overlayText.style.color = '';
        }
        if (overlayButton) {
            overlayButton.style.backgroundColor = '';
        }
    }
    
    speedOverlay.style.opacity = '1';
    clearTimeout(speedOverlay._hideTimeout);
    speedOverlay._hideTimeout = setTimeout(() => {
        if (speedOverlay) speedOverlay.style.opacity = '0';
    }, 1200);
}
function createSpeedToggleButton() {
    if (speedToggleButtonContainer) return;
    
    // Создаём контейнер для кнопки (как у других кнопок взаимодействия YouTube)
    speedToggleButtonContainer = document.createElement('div');
    speedToggleButtonContainer.style.cssText = 'display: flex; flex-direction: column; align-items: center; gap: 4px;';
    
    // Создаём саму кнопку в стиле YouTube
    speedToggleButton = document.createElement('button');
    speedToggleButton.className = 'yt-spec-button-shape-next yt-spec-button-shape-next--tonal yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-m yt-spec-button-shape-next--icon-button';
    speedToggleButton.title = 'Toggle Shorts Speed (1x/выбранная)';
    speedToggleButton.style.cssText = 'width: 48px; height: 48px; border-radius: 50%; padding: 0; margin: 0; display: flex; align-items: center; justify-content: center; cursor: pointer;';
    
    // Создаём иконку внутри кнопки (как у других кнопок YouTube)
    const iconDiv = document.createElement('div');
    iconDiv.className = 'yt-spec-button-shape-next__icon';
    iconDiv.style.cssText = 'width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;';
    iconDiv.textContent = '⏩';
    iconDiv.style.fontSize = '20px';
    
    speedToggleButton.appendChild(iconDiv);
    
    speedToggleButton.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleShortsPlaybackSpeed();
    });
    
    // Создаём текст под кнопкой (как у других кнопок YouTube)
    const speedText = document.createElement('span');
    speedText.id = 'ytplus-speed-text';
    speedText.className = 'yt-core-attributed-string yt-core-attributed-string--white-space-no-wrap yt-core-attributed-string--text-alignment-center';
    speedText.textContent = `${selectedSpeed}x`;
    speedText.style.cssText = 'color: rgba(255, 255, 255, 0.9); font-size: 12px; font-weight: 400; line-height: 1.2; text-align: center; margin-top: 4px;';
    
    // Добавляем кнопку и текст в контейнер
    speedToggleButtonContainer.appendChild(speedToggleButton);
    speedToggleButtonContainer.appendChild(speedText);
}
function updateSpeedToggleButton(speed) {
    if (!speedToggleButton || !speedToggleButtonContainer) return;
    speedToggleButton.title = `Текущая: ${speed}x. Клик — переключить.`;
    const speedText = speedToggleButtonContainer.querySelector('#ytplus-speed-text');
    if (speedText) {
        speedText.textContent = `${selectedSpeed}x`;
    }
    // Обновляем стиль кнопки в зависимости от состояния (как у активных кнопок YouTube)
    const iconDiv = speedToggleButton.querySelector('.yt-spec-button-shape-next__icon');
    if (speed !== 1) {
        // Активное состояние - подсвечиваем иконку
        if (iconDiv) {
            iconDiv.style.color = '#3ea6ff';
        }
        speedToggleButton.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
    } else {
        // Неактивное состояние - стандартный цвет
        if (iconDiv) {
            iconDiv.style.color = '';
        }
        speedToggleButton.style.backgroundColor = '';
    }
}
function injectSpeedToggleButton() {
    if (!currentVideoElement) return;
    // Проверяем, включена ли функция ускорения
    if (!shortsSpeedEnabled) {
        removeSpeedUI();
        return;
    }
    
    // Находим активный Short (как в оригинальном расширении)
    const activeShort = document.querySelector('ytd-reel-video-renderer[is-active]');
    if (!activeShort) {
        // Если активный не найден, пробуем найти любой Short
        const anyShort = document.querySelector('ytd-reel-video-renderer');
        if (!anyShort) return;
        addButtonToPlayer(anyShort);
        return;
    }
    
    addButtonToPlayer(activeShort);
}

function addButtonToPlayer(rendererNode) {
    // Ищем контейнер #actions внутри ytd-reel-player-overlay-renderer (как в оригинальном расширении)
    const actionsContainer = rendererNode.querySelector('ytd-reel-player-overlay-renderer #actions');
    
    // Если контейнер не найден или кнопка уже добавлена, выходим
    if (!actionsContainer || rendererNode.querySelector('.ytplus-speed-button')) {
        return;
    }
    
    createSpeedToggleButton();
    
    // Добавляем класс для идентификации
    speedToggleButtonContainer.classList.add('ytplus-speed-button');
    
    // Вставляем кнопку в начало контейнера (сверху) используя prepend (как в оригинале)
    actionsContainer.prepend(speedToggleButtonContainer);
    
    updateSpeedToggleButton(shortsSpeedState);
}
function removeSpeedUI() {
    if (speedOverlay && speedOverlay.parentNode) speedOverlay.parentNode.removeChild(speedOverlay);
    speedOverlay = null;
    if (speedToggleButtonContainer && speedToggleButtonContainer.parentNode) {
        speedToggleButtonContainer.parentNode.removeChild(speedToggleButtonContainer);
    }
    speedToggleButtonContainer = null;
    speedToggleButton = null;
}
// Обработчик горячих клавиш для переключения скорости Shorts
(function shortsSpeedShortcutListener() {
    document.addEventListener('keydown', function(e) {
        if (!e.key) return;
        if (!isShortsPage() || !currentVideoElement) return;
        // Проверяем, включена ли функция ускорения
        if (!shortsSpeedEnabled) return;
        
        // Используем функцию проверки комбинации с поддержкой альтернативной раскладки
        if (checkShortsSpeedKeys(shortsSpeedShortcut, e)) {
            e.preventDefault();
            toggleShortsPlaybackSpeed();
        }
    });
})();

// Функция для проверки комбинации клавиш для скорости Shorts (с поддержкой альтернативной раскладки)
function checkShortsSpeedKeys(keys, event) {
    if (!keys || keys.length === 0)
        return false;
    
    // Собираем текущие нажатые клавиши
    const pressed = [];
    if (event.ctrlKey) pressed.push('ctrl');
    if (event.shiftKey) pressed.push('shift');
    if (event.altKey) pressed.push('alt');
    if (event.metaKey) pressed.push('meta');
    
    // Добавляем основную клавишу (если это не модификатор)
    const key = event.key.toLowerCase();
    if (key && !['control', 'shift', 'alt', 'meta', 'capslock'].includes(key)) {
        pressed.push(key);
    }
    
    // Проверяем соответствие
    if (pressed.length !== keys.length) return false;
    
    // Проверяем точное соответствие
    const exactMatch = pressed.every((pressedKey, index) => pressedKey === keys[index]);
    if (exactMatch) return true;
    
    // Проверяем соответствие с учетом альтернативной раскладки
    // Модификаторы должны точно совпадать
    for (let i = 0; i < pressed.length - 1; i++) {
        if (pressed[i] !== keys[i]) return false;
    }
    
    // Основная клавиша может быть в альтернативной раскладке
    const lastPressedKey = pressed[pressed.length - 1];
    const lastKeyInShortcut = keys[keys.length - 1];
    
    // Проверяем точное совпадение или альтернативную раскладку
    return lastPressedKey === lastKeyInShortcut || 
           getAlternativeLayout(lastPressedKey) === lastKeyInShortcut ||
           lastPressedKey === getAlternativeLayout(lastKeyInShortcut);
}
// Обработчик горячих клавиш для прокрутки Shorts вверх/вниз
(function shortsScrollKeyListener() {
    document.addEventListener('keydown', function(e) {
        if (!e.key) return;
        if (!isShortsPage() || !currentVideoElement) return;
        // Проверяем, включена ли функция прокрутки
        if (!shortsScrollEnabled) return;
        
        // Проверяем комбинацию для прокрутки вниз (следующий Short)
        if (checkShortsScrollKeys(shortsScrollDownShortcut, e)) {
            e.preventDefault();
            scrollDirection = 1;
            scrollToNextShort(currentShortId);
        }
        
        // Проверяем комбинацию для прокрутки вверх (предыдущий Short)
        if (checkShortsScrollKeys(shortsScrollUpShortcut, e)) {
            e.preventDefault();
            scrollDirection = -1;
            scrollToNextShort(currentShortId);
        }
    });
})();

// Функция для проверки комбинации клавиш для прокрутки Shorts (с поддержкой альтернативной раскладки)
function checkShortsScrollKeys(keys, event) {
    if (!keys || keys.length === 0)
        return false;
    
    // Собираем текущие нажатые клавиши
    const pressed = [];
    if (event.ctrlKey) pressed.push('ctrl');
    if (event.shiftKey) pressed.push('shift');
    if (event.altKey) pressed.push('alt');
    if (event.metaKey) pressed.push('meta');
    
    // Добавляем основную клавишу (если это не модификатор)
    const key = event.key.toLowerCase();
    if (key && !['control', 'shift', 'alt', 'meta', 'capslock'].includes(key)) {
        pressed.push(key);
    }
    
    // Проверяем соответствие
    if (pressed.length !== keys.length) return false;
    
    // Проверяем точное соответствие
    const exactMatch = pressed.every((pressedKey, index) => pressedKey === keys[index]);
    if (exactMatch) return true;
    
    // Проверяем соответствие с учетом альтернативной раскладки
    // Модификаторы должны точно совпадать
    for (let i = 0; i < pressed.length - 1; i++) {
        if (pressed[i] !== keys[i]) return false;
    }
    
    // Основная клавиша может быть в альтернативной раскладке
    const lastPressedKey = pressed[pressed.length - 1];
    const lastKeyInShortcut = keys[keys.length - 1];
    
    // Проверяем точное совпадение или альтернативную раскладку
    return lastPressedKey === lastKeyInShortcut || 
           getAlternativeLayout(lastPressedKey) === lastKeyInShortcut ||
           lastPressedKey === getAlternativeLayout(lastKeyInShortcut);
}

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
    // Проверяем, включена ли функция ускорения
    if (!normalVideoSpeedEnabled) return;
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
// Обработчик горячих клавиш для переключения скорости обычных видео
(function normalVideoSpeedShortcutListener() {
    document.addEventListener('keydown', function(e) {
        if (!e.key) return;
        if (isShortsPage()) return;
        // Проверяем, включена ли функция ускорения
        if (!normalVideoSpeedEnabled) return;
        
        // Используем функцию проверки комбинации с поддержкой альтернативной раскладки
        if (checkNormalVideoSpeedKeys(normalVideoSpeedShortcut, e)) {
            const video = document.querySelector('video');
            if (video) {
                e.preventDefault();
                toggleNormalVideoPlaybackSpeed();
            }
        }
    });
})();

// Функция для проверки комбинации клавиш для скорости обычных видео (с поддержкой альтернативной раскладки)
function checkNormalVideoSpeedKeys(keys, event) {
    if (!keys || keys.length === 0)
        return false;
    
    // Собираем текущие нажатые клавиши
    const pressed = [];
    if (event.ctrlKey) pressed.push('ctrl');
    if (event.shiftKey) pressed.push('shift');
    if (event.altKey) pressed.push('alt');
    if (event.metaKey) pressed.push('meta');
    
    // Добавляем основную клавишу (если это не модификатор)
    const key = event.key.toLowerCase();
    if (key && !['control', 'shift', 'alt', 'meta', 'capslock'].includes(key)) {
        pressed.push(key);
    }
    
    // Проверяем соответствие
    if (pressed.length !== keys.length) return false;
    
    // Проверяем точное соответствие
    const exactMatch = pressed.every((pressedKey, index) => pressedKey === keys[index]);
    if (exactMatch) return true;
    
    // Проверяем соответствие с учетом альтернативной раскладки
    // Модификаторы должны точно совпадать
    for (let i = 0; i < pressed.length - 1; i++) {
        if (pressed[i] !== keys[i]) return false;
    }
    
    // Основная клавиша может быть в альтернативной раскладке
    const lastPressedKey = pressed[pressed.length - 1];
    const lastKeyInShortcut = keys[keys.length - 1];
    
    // Проверяем точное совпадение или альтернативную раскладку
    return lastPressedKey === lastKeyInShortcut || 
           getAlternativeLayout(lastPressedKey) === lastKeyInShortcut ||
           lastPressedKey === getAlternativeLayout(lastKeyInShortcut);
}

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

// ------------------------------
// HIDE CONTROLS FEATURE
// ------------------------------
let hideControlsStyle = null;
let hideControlsEnabled = false; // Включена ли функция (работают ли горячие клавиши)
let controlsHidden = false; // Скрыты ли элементы управления
let hideControlsShortcut = ['shift', 'h'];

// Функция для создания и применения стилей скрытия элементов управления
function applyHideControlsStyles() {
    // Удаляем старые стили, если они есть
    if (hideControlsStyle && hideControlsStyle.parentNode) {
        hideControlsStyle.parentNode.removeChild(hideControlsStyle);
        hideControlsStyle = null;
    }

    // Применяем стили только если элементы управления должны быть скрыты
    if (!controlsHidden) {
        return;
    }

    // Создаем новый элемент style
    hideControlsStyle = document.createElement('style');
    hideControlsStyle.id = 'ytplus-hide-controls-styles';
    
    const css = `
        /* Скрытие элементов управления YouTube для обычных видео */
        .ytp-chrome-bottom,
        .ytp-chrome-controls,
        .ytp-progress-bar-container,
        .ytp-progress-bar,
        .ytp-gradient-bottom,
        .ytp-gradient-top,
        .ytp-player-controls,
        .ytp-ce-shadow,
        .ytp-ce-element,
        .ytp-show-cards-title,
        .ytp-title,
        .ytp-title-channel,
        .ytp-chrome-top,
        .ytp-watermark,
        .ytp-pause-overlay,
        .ytp-cued-thumbnail-overlay,
        .branding-img.iv-click-target {
            display: none !important;
            opacity: 0 !important;
            visibility: hidden !important;
            pointer-events: none !important;
        }
        
        /* Скрытие элементов управления для Shorts */
        ytd-reel-player-overlay-renderer #controls,
        ytd-reel-player-overlay-renderer #gradient,
        ytd-reel-player-overlay-renderer .ytp-progress-bar-container,
        ytd-reel-player-overlay-renderer .ytp-progress-bar,
        ytd-reel-player-overlay-renderer ytd-reel-player-controls-renderer,
        ytd-reel-player-overlay-renderer #gradient-bottom,
        ytd-reel-player-overlay-renderer #gradient-top {
            display: none !important;
            opacity: 0 !important;
            visibility: hidden !important;
            pointer-events: none !important;
        }
        
        /* Скрытие прогресс-бара везде */
        .ytp-progress-list,
        .ytp-scroll-container,
        .ytp-timed-markers-container {
            display: none !important;
        }
        
        /* Убираем отступы снизу, если они были из-за панели управления */
        #ytp-gradient-bottom {
            display: none !important;
        }
    `;
    
    hideControlsStyle.textContent = css;
    document.head.appendChild(hideControlsStyle);
}

// Функция для переключения скрытия элементов управления (вызывается горячими клавишами)
function toggleHideControls() {
    // Горячие клавиши работают только если функция включена
    if (!hideControlsEnabled) {
        return;
    }
    
    controlsHidden = !controlsHidden;
    chrome.storage.local.set({ controlsHidden: controlsHidden });
    applyHideControlsStyles();
}

// Маппинг английских и русских букв на одной позиции клавиатуры
const keyboardLayoutMap = {
    // Английский -> Русский
    'q': 'й', 'w': 'ц', 'e': 'у', 'r': 'к', 't': 'е', 'y': 'н', 'u': 'г', 'i': 'ш', 'o': 'щ', 'p': 'з',
    '[': 'х', ']': 'ъ', 'a': 'ф', 's': 'ы', 'd': 'в', 'f': 'а', 'g': 'п', 'h': 'р', 'j': 'о', 'k': 'л',
    'l': 'д', ';': 'ж', "'": 'э', 'z': 'я', 'x': 'ч', 'c': 'с', 'v': 'м', 'b': 'и', 'n': 'т', 'm': 'ь',
    ',': 'б', '.': 'ю', '/': '.',
    // Русский -> Английский (обратный маппинг)
    'й': 'q', 'ц': 'w', 'у': 'e', 'к': 'r', 'е': 't', 'н': 'y', 'г': 'u', 'ш': 'i', 'щ': 'o', 'з': 'p',
    'х': '[', 'ъ': ']', 'ф': 'a', 'ы': 's', 'в': 'd', 'а': 'f', 'п': 'g', 'р': 'h', 'о': 'j', 'л': 'k',
    'д': 'l', 'ж': ';', 'э': "'", 'я': 'z', 'ч': 'x', 'с': 'c', 'м': 'v', 'и': 'b', 'т': 'n', 'ь': 'm',
    'б': ',', 'ю': '.'
};

// Функция для получения альтернативной раскладки клавиши
function getAlternativeLayout(key) {
    return keyboardLayoutMap[key] || null;
}

// Функция для проверки комбинации клавиш
function checkHideControlsKeys(keys, event) {
    if (!keys || keys.length === 0)
        return false;
    
    // Собираем текущие нажатые клавиши
    const pressed = [];
    if (event.ctrlKey) pressed.push('ctrl');
    if (event.shiftKey) pressed.push('shift');
    if (event.altKey) pressed.push('alt');
    if (event.metaKey) pressed.push('meta');
    
    // Добавляем основную клавишу (если это не модификатор)
    const key = event.key.toLowerCase();
    if (key && !['control', 'shift', 'alt', 'meta', 'capslock'].includes(key)) {
        pressed.push(key);
    }
    
    // Проверяем соответствие
    if (pressed.length !== keys.length) return false;
    
    // Проверяем точное соответствие
    const exactMatch = pressed.every((pressedKey, index) => pressedKey === keys[index]);
    if (exactMatch) return true;
    
    // Проверяем соответствие с учетом альтернативной раскладки
    // Модификаторы должны точно совпадать
    for (let i = 0; i < pressed.length - 1; i++) {
        if (pressed[i] !== keys[i]) return false;
    }
    
    // Основная клавиша может быть в альтернативной раскладке
    const lastPressedKey = pressed[pressed.length - 1];
    const lastKeyInShortcut = keys[keys.length - 1];
    
    // Проверяем точное совпадение или альтернативную раскладку
    return lastPressedKey === lastKeyInShortcut || 
           getAlternativeLayout(lastPressedKey) === lastKeyInShortcut ||
           lastPressedKey === getAlternativeLayout(lastKeyInShortcut);
}

// Инициализация скрытия элементов управления
(function initHideControls() {
    // Загружаем настройки из storage
    chrome.storage.local.get(['hideControlsEnabled', 'controlsHidden', 'hideControlsShortcut'], (result) => {
        hideControlsEnabled = result.hideControlsEnabled || false;
        controlsHidden = result.controlsHidden || false;
        // Если функция выключена - гарантируем, что элементы управления видны
        if (!hideControlsEnabled) {
            controlsHidden = false;
            chrome.storage.local.set({ controlsHidden: false });
        }
        if (result.hideControlsShortcut) {
            hideControlsShortcut = result.hideControlsShortcut;
        }
        applyHideControlsStyles();
    });

    // Слушаем изменения настроек
    chrome.storage.onChanged.addListener((changes) => {
        if (changes.hideControlsEnabled) {
            hideControlsEnabled = changes.hideControlsEnabled.newValue || false;
            // Если функция выключена - показываем элементы управления
            if (!hideControlsEnabled) {
                controlsHidden = false;
                chrome.storage.local.set({ controlsHidden: false });
            }
            applyHideControlsStyles();
        }
        if (changes.controlsHidden) {
            controlsHidden = changes.controlsHidden.newValue || false;
            applyHideControlsStyles();
        }
        if (changes.hideControlsShortcut) {
            hideControlsShortcut = changes.hideControlsShortcut.newValue || ['shift', 'h'];
        }
    });

    // Применяем стили при загрузке страницы и при изменении DOM (для динамического контента YouTube)
    const observer = new MutationObserver(() => {
        if (controlsHidden && (!hideControlsStyle || !document.head.contains(hideControlsStyle))) {
            applyHideControlsStyles();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Применяем стили сразу
    applyHideControlsStyles();
})();

// Обработчик горячих клавиш для переключения скрытия элементов управления
(function hideControlsShortcutListener() {
    document.addEventListener('keydown', function(e) {
        if (!e.key) return;
        
        // Горячие клавиши работают только если функция включена
        if (!hideControlsEnabled) return;
        
        // Проверяем комбинацию
        if (checkHideControlsKeys(hideControlsShortcut, e)) {
            e.preventDefault();
            toggleHideControls();
        }
    });
})();
