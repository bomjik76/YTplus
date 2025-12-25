// VARIBLES
const errMsg = document.querySelector("#error-message");
const statusToggle = document.querySelector("#status-toggle");
const filteredAuthorsInput = document.querySelector("#filterAuthors");
const whitelistedAuthorsInput = document.querySelector("#whitelistedAuthors");
const filteredTagsInput = document.querySelector("#filterTags");
const shortCutInput = document.querySelector("#shortCutInput");
const shortCutInteractInput = document.querySelector("#shortCutInteractInput");
const filterByMaxLengthInput = document.querySelector("#filterByMaxLength");
const filterByMinLengthInput = document.querySelector("#filterByMinLength");
const filterByMinViewsInput = document.querySelector("#filterByMinViews");
const filterByMaxViewsInput = document.querySelector("#filterByMaxViews");
const filterByMinLikesInput = document.querySelector("#filterByMinLikes");
const filterByMaxLikesInput = document.querySelector("#filterByMaxLikes");
const filterByMinCommentsInput = document.querySelector("#filterByMinComments");
const filterByMaxCommentsInput = document.querySelector("#filterByMaxComments");
const scrollDirectionInput = document.querySelector("#scrollDirectionInput");
const amountOfPlaysInput = document.querySelector("#amountOfPlaysInput");
const scrollOnCommentsInput = document.querySelector("#scrollOnCommentsInput");
const scrollOnNoTagsInput = document.querySelector("#scrollOnNoTagsInput");
const additionalScrollDelayInput = document.querySelector("#additionalScrollDelayInput");
const shortsSpeedEnabled = document.querySelector("#shorts-speed-enabled");
const shortsSpeedSelect = document.querySelector("#shorts-speed-select");
const shortsSpeedShortcut = document.querySelector("#shorts-speed-shortcut");
const shortsScrollEnabled = document.querySelector("#shorts-scroll-enabled");
const shortsScrollDownShortcut = document.querySelector("#shorts-scroll-down-shortcut");
const shortsScrollUpShortcut = document.querySelector("#shorts-scroll-up-shortcut");
const normalVideoSpeedEnabled = document.querySelector("#normal-video-speed-enabled");
const normalVideoSpeedShortcut = document.querySelector("#normal-video-speed-shortcut");
// Progress Bar Elements
const progressBarEnabled = document.querySelector("#progress-bar-enabled");
const progressBarSettings = document.querySelector("#progress-bar-settings");
const progressColorInput = document.querySelector("#progress-color");
const scrubberColorInput = document.querySelector("#scrubber-color");
const bufferColorInput = document.querySelector("#buffer-color");
const resetProgressColorsBtn = document.querySelector("#reset-progress-colors");
const scrubberTypeColor = document.querySelector("#scrubber-type-color");
const scrubberTypeImage = document.querySelector("#scrubber-type-image");
const scrubberColorContainer = document.querySelector("#scrubber-color-container");
const scrubberImageContainer = document.querySelector("#scrubber-image-container");
const scrubberImageInput = document.querySelector("#scrubber-image");
const scrubberImagePreview = document.querySelector("#scrubber-image-preview");
const removeScrubberImageBtn = document.querySelector("#remove-scrubber-image");
const scrubberImageSizeInput = document.querySelector("#scrubber-image-size");
const scrubberImageSizeValue = document.querySelector("#scrubber-image-size-value");
const hideControlsEnabled = document.querySelector("#hide-controls-enabled");
const hideControlsShortcut = document.querySelector("#hide-controls-shortcut");
// Navigation Elements
const navItems = document.querySelectorAll(".nav-item");
const contentPanels = document.querySelectorAll(".content-panel");
// Call Functions
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем, что все элементы найдены
    console.log("[YT+] Initializing popup...");
    console.log("[YT+] progressBarEnabled found:", !!progressBarEnabled);
    console.log("[YT+] progressBarSettings found:", !!progressBarSettings);
    
    getAllSettingsForPopup();
    setupNavigation();
    setupEventListeners();
    
    // Дополнительная проверка после небольшой задержки
    setTimeout(() => {
        if (!progressBarEnabled) {
            console.error("[YT+] progressBarEnabled still not found after initialization!");
        }
    }, 100);
});
// Listens to toggle button click
document.onclick = (e) => {
    if (e.target.classList.contains("toggleBtn"))
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            if (!tabs[0]?.url?.toLowerCase().includes("youtube.com")) {
                errMsg.innerText = "Only can be toggled on Youtube!";
            }
            else {
                // get applicationIsOn from chrome storage
                chrome.storage.local.get(["applicationIsOn"], (result) => {
                    if (!result.applicationIsOn) {
                        chrome.storage.local.set({ applicationIsOn: true });
                        changeToggleButton(true);
                    }
                    else {
                        chrome.storage.local.set({ applicationIsOn: false });
                        changeToggleButton(false);
                    }
                });
            }
        });
};
function changeToggleButton(result) {
    statusToggle.checked = result;
}
function setupNavigation() {
    navItems.forEach((item) => {
        item.addEventListener("click", () => {
            const targetPanelId = item.dataset.targetPanel;
            // Update nav item active state
            navItems.forEach((nav) => nav.classList.remove("active"));
            item.classList.add("active");
            // Update content panel active state
            contentPanels.forEach((panel) => {
                if (panel.id === targetPanelId) {
                    panel.classList.add("active");
                }
                else {
                    panel.classList.remove("active");
                }
            });
        });
    });
}
function setupEventListeners() {
    // Master Status Toggle
    if (statusToggle) {
        statusToggle.addEventListener("change", (e) => {
            const isChecked = e.target.checked;
            chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
                if (!tabs[0]?.url?.toLowerCase().includes("youtube.com/shorts")) {
                    errMsg.innerText = "";
                    chrome.storage.local.set({ applicationIsOn: isChecked });
                } else {
                    if (errMsg) {
                        errMsg.innerText = "";
                    }
                    chrome.storage.local.set({ applicationIsOn: isChecked });
                }
            });
        });
    }
    // Update listeners to use 'input' for textareas for better responsiveness
    if (filteredAuthorsInput) {
        filteredAuthorsInput.addEventListener("input", handleListInputChange(filteredAuthorsInput, "filteredAuthors"));
    }
    if (whitelistedAuthorsInput) {
        whitelistedAuthorsInput.addEventListener("input", handleListInputChange(whitelistedAuthorsInput, "whitelistedAuthors"));
    }
    if (filteredTagsInput) {
        filteredTagsInput.addEventListener("input", handleListInputChange(filteredTagsInput, "filteredTags"));
    }
    // Use 'change' for inputs/selects that don't need instant updates
    if (shortCutInput) {
        shortCutInput.addEventListener("change", handleShortcutInputChange(shortCutInput, "shortCutKeys", "shift+d"));
    }
    if (shortCutInteractInput) {
        shortCutInteractInput.addEventListener("change", handleShortcutInputChange(shortCutInteractInput, "shortCutInteractKeys", "shift+g"));
    }
    if (filterByMinLengthInput) {
        filterByMinLengthInput.addEventListener("change", handleSelectChange("filterByMinLength"));
    }
    if (filterByMaxLengthInput) {
        filterByMaxLengthInput.addEventListener("change", handleSelectChange("filterByMaxLength"));
    }
    if (filterByMinViewsInput) {
        filterByMinViewsInput.addEventListener("change", handleNumericInputChange("filterByMinViews"));
    }
    if (filterByMaxViewsInput) {
        filterByMaxViewsInput.addEventListener("change", handleNumericInputChange("filterByMaxViews"));
    }
    if (filterByMinLikesInput) {
        filterByMinLikesInput.addEventListener("change", handleNumericInputChange("filterByMinLikes"));
    }
    if (filterByMaxLikesInput) {
        filterByMaxLikesInput.addEventListener("change", handleNumericInputChange("filterByMaxLikes"));
    }
    if (filterByMinCommentsInput) {
        filterByMinCommentsInput.addEventListener("change", handleNumericInputChange("filterByMinComments"));
    }
    if (filterByMaxCommentsInput) {
        filterByMaxCommentsInput.addEventListener("change", handleNumericInputChange("filterByMaxComments"));
    }
    if (scrollDirectionInput) {
        scrollDirectionInput.addEventListener("change", handleSelectChange("scrollDirection"));
    }
    if (amountOfPlaysInput) {
        amountOfPlaysInput.addEventListener("change", handleIntegerInputChange("amountOfPlaysToSkip", 1));
    }
    if (additionalScrollDelayInput) {
        additionalScrollDelayInput.addEventListener("change", handleIntegerInputChange("additionalScrollDelay", 0));
    }
    if (scrollOnCommentsInput) {
        scrollOnCommentsInput.addEventListener("change", handleCheckboxChange("scrollOnComments"));
    }
    if (scrollOnNoTagsInput) {
        scrollOnNoTagsInput.addEventListener("change", handleCheckboxChange("scrollOnNoTags"));
    }
    // Shorts Speed Enabled Toggle
    if (shortsSpeedEnabled) {
        shortsSpeedEnabled.addEventListener("change", (e) => {
            const enabled = e.target.checked;
            chrome.storage.local.set({ shortsSpeedEnabled: enabled });
        });
    }
    // Shorts Speed Select
    if (shortsSpeedSelect) {
        shortsSpeedSelect.addEventListener("change", (e) => {
            const speed = parseFloat(e.target.value);
            chrome.storage.local.set({ shortsSelectedSpeed: speed });
        });
    }
    // Shorts Speed Shortcut - запись комбинации клавиш
    if (shortsSpeedShortcut) {
        let isRecording = false;
        
        // При фокусе на поле начинаем запись
        shortsSpeedShortcut.addEventListener("focus", function(e) {
            isRecording = true;
            shortsSpeedShortcut.value = "";
            shortsSpeedShortcut.placeholder = "Нажмите комбинацию клавиш...";
        });
        
        // При потере фокуса прекращаем запись
        shortsSpeedShortcut.addEventListener("blur", function() {
            isRecording = false;
        });
        
        // Записываем комбинацию клавиш
        shortsSpeedShortcut.addEventListener("keydown", function(e) {
            if (!isRecording) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            // Игнорируем клавиши, которые используются для навигации
            if (e.key === 'Tab') {
                return; // Разрешаем Tab для выхода из поля
            }
            
            // Собираем комбинацию клавиш
            const keys = [];
            if (e.ctrlKey) keys.push('ctrl');
            if (e.shiftKey) keys.push('shift');
            if (e.altKey) keys.push('alt');
            if (e.metaKey) keys.push('meta');
            
            // Добавляем основную клавишу (если это не модификатор)
            const key = e.key.toLowerCase();
            if (key && !['control', 'shift', 'alt', 'meta', 'capslock', 'tab'].includes(key)) {
                keys.push(key);
                
                // Минимум должна быть одна клавиша
                if (keys.length > 0) {
                    // Форматируем и отображаем комбинацию
                    const keysStr = keys.join('+');
                    shortsSpeedShortcut.value = keysStr;
                    
                    // Сохраняем в storage
                    chrome.storage.local.set({ shortsSpeedShortcut: keys });
                    
                    // Убираем фокус после записи
                    setTimeout(() => {
                        shortsSpeedShortcut.blur();
                    }, 100);
                }
            }
        });
        
        // Предотвращаем обычный ввод текста
        shortsSpeedShortcut.addEventListener("keypress", function(e) {
            if (isRecording) {
                e.preventDefault();
            }
        });
        
        // Предотвращаем ввод текста через paste
        shortsSpeedShortcut.addEventListener("paste", function(e) {
            e.preventDefault();
        });
        
        // Обработчик для случая, если пользователь все же введет текст вручную (резервный)
        shortsSpeedShortcut.addEventListener("change", handleShortcutInputChange(shortsSpeedShortcut, "shortsSpeedShortcut", "shift+s"));
    }
    // Shorts Scroll Down Shortcut - запись комбинации клавиш
    if (shortsScrollDownShortcut) {
        let isRecording = false;
        
        shortsScrollDownShortcut.addEventListener("focus", function(e) {
            isRecording = true;
            shortsScrollDownShortcut.value = "";
            shortsScrollDownShortcut.placeholder = "Нажмите комбинацию клавиш...";
        });
        
        shortsScrollDownShortcut.addEventListener("blur", function() {
            isRecording = false;
        });
        
        shortsScrollDownShortcut.addEventListener("keydown", function(e) {
            if (!isRecording) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            if (e.key === 'Tab') {
                return;
            }
            
            const keys = [];
            if (e.ctrlKey) keys.push('ctrl');
            if (e.shiftKey) keys.push('shift');
            if (e.altKey) keys.push('alt');
            if (e.metaKey) keys.push('meta');
            
            const key = e.key.toLowerCase();
            if (key && !['control', 'shift', 'alt', 'meta', 'capslock', 'tab'].includes(key)) {
                keys.push(key);
                
                if (keys.length > 0) {
                    const keysStr = keys.join('+');
                    shortsScrollDownShortcut.value = keysStr;
                    chrome.storage.local.set({ shortsScrollDownShortcut: keys });
                    
                    setTimeout(() => {
                        shortsScrollDownShortcut.blur();
                    }, 100);
                }
            }
        });
        
        shortsScrollDownShortcut.addEventListener("keypress", function(e) {
            if (isRecording) {
                e.preventDefault();
            }
        });
        
        shortsScrollDownShortcut.addEventListener("paste", function(e) {
            e.preventDefault();
        });
        
        shortsScrollDownShortcut.addEventListener("change", handleShortcutInputChange(shortsScrollDownShortcut, "shortsScrollDownShortcut", "d"));
    }
    // Shorts Scroll Up Shortcut - запись комбинации клавиш
    if (shortsScrollUpShortcut) {
        let isRecording = false;
        
        shortsScrollUpShortcut.addEventListener("focus", function(e) {
            isRecording = true;
            shortsScrollUpShortcut.value = "";
            shortsScrollUpShortcut.placeholder = "Нажмите комбинацию клавиш...";
        });
        
        shortsScrollUpShortcut.addEventListener("blur", function() {
            isRecording = false;
        });
        
        shortsScrollUpShortcut.addEventListener("keydown", function(e) {
            if (!isRecording) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            if (e.key === 'Tab') {
                return;
            }
            
            const keys = [];
            if (e.ctrlKey) keys.push('ctrl');
            if (e.shiftKey) keys.push('shift');
            if (e.altKey) keys.push('alt');
            if (e.metaKey) keys.push('meta');
            
            const key = e.key.toLowerCase();
            if (key && !['control', 'shift', 'alt', 'meta', 'capslock', 'tab'].includes(key)) {
                keys.push(key);
                
                if (keys.length > 0) {
                    const keysStr = keys.join('+');
                    shortsScrollUpShortcut.value = keysStr;
                    chrome.storage.local.set({ shortsScrollUpShortcut: keys });
                    
                    setTimeout(() => {
                        shortsScrollUpShortcut.blur();
                    }, 100);
                }
            }
        });
        
        shortsScrollUpShortcut.addEventListener("keypress", function(e) {
            if (isRecording) {
                e.preventDefault();
            }
        });
        
        shortsScrollUpShortcut.addEventListener("paste", function(e) {
            e.preventDefault();
        });
        
        shortsScrollUpShortcut.addEventListener("change", handleShortcutInputChange(shortsScrollUpShortcut, "shortsScrollUpShortcut", "e"));
    }
    // Normal Video Speed Enabled Toggle
    if (normalVideoSpeedEnabled) {
        normalVideoSpeedEnabled.addEventListener("change", (e) => {
            const enabled = e.target.checked;
            chrome.storage.local.set({ normalVideoSpeedEnabled: enabled });
        });
    }
    // Normal Video Speed Shortcut - запись комбинации клавиш
    if (normalVideoSpeedShortcut) {
        let isRecording = false;
        
        normalVideoSpeedShortcut.addEventListener("focus", function(e) {
            isRecording = true;
            normalVideoSpeedShortcut.value = "";
            normalVideoSpeedShortcut.placeholder = "Нажмите комбинацию клавиш...";
        });
        
        normalVideoSpeedShortcut.addEventListener("blur", function() {
            isRecording = false;
        });
        
        normalVideoSpeedShortcut.addEventListener("keydown", function(e) {
            if (!isRecording) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            if (e.key === 'Tab') {
                return;
            }
            
            const keys = [];
            if (e.ctrlKey) keys.push('ctrl');
            if (e.shiftKey) keys.push('shift');
            if (e.altKey) keys.push('alt');
            if (e.metaKey) keys.push('meta');
            
            const key = e.key.toLowerCase();
            if (key && !['control', 'shift', 'alt', 'meta', 'capslock', 'tab'].includes(key)) {
                keys.push(key);
                
                if (keys.length > 0) {
                    const keysStr = keys.join('+');
                    normalVideoSpeedShortcut.value = keysStr;
                    chrome.storage.local.set({ normalVideoSpeedShortcut: keys });
                    
                    setTimeout(() => {
                        normalVideoSpeedShortcut.blur();
                    }, 100);
                }
            }
        });
        
        normalVideoSpeedShortcut.addEventListener("keypress", function(e) {
            if (isRecording) {
                e.preventDefault();
            }
        });
        
        normalVideoSpeedShortcut.addEventListener("paste", function(e) {
            e.preventDefault();
        });
        
        normalVideoSpeedShortcut.addEventListener("change", handleShortcutInputChange(normalVideoSpeedShortcut, "normalVideoSpeedShortcut", "shift+s"));
    }
    // Progress Bar Settings
    if (progressBarEnabled) {
        // Обработчик изменения состояния переключателя
        const handleProgressBarToggle = (e) => {
            const enabled = e.target.checked;
            console.log("[YT+] Progress bar toggle changed:", enabled);
            if (progressBarSettings) {
                progressBarSettings.style.display = enabled ? "block" : "none";
            }
            chrome.storage.local.get(["progressBarColors"], (result) => {
                const colors = result.progressBarColors || {
                    progressColor: "#ff0000",
                    scrubberColor: "#ff0000",
                    bufferColor: "#ffffff",
                    enabled: false
                };
                colors.enabled = enabled;
                chrome.storage.local.set({ progressBarColors: colors }, () => {
                    console.log("[YT+] Progress bar colors saved:", colors);
                });
            });
        };
        
        progressBarEnabled.addEventListener("change", handleProgressBarToggle);
        progressBarEnabled.addEventListener("click", (e) => {
            // Дополнительная обработка клика для надежности
            console.log("[YT+] Progress bar clicked, checked:", e.target.checked);
        });
        
        console.log("[YT+] Progress bar toggle event listener attached");
    } else {
        console.error("[YT+] progressBarEnabled element not found! Retrying...");
        // Попытка найти элемент еще раз через небольшую задержку
        setTimeout(() => {
            const retryElement = document.querySelector("#progress-bar-enabled");
            if (retryElement) {
                console.log("[YT+] Found progressBarEnabled on retry");
                retryElement.addEventListener("change", (e) => {
                    const enabled = e.target.checked;
                    if (progressBarSettings) {
                        progressBarSettings.style.display = enabled ? "block" : "none";
                    }
                    chrome.storage.local.get(["progressBarColors"], (result) => {
                        const colors = result.progressBarColors || {
                            progressColor: "#ff0000",
                            scrubberColor: "#ff0000",
                            bufferColor: "#ffffff",
                            enabled: false
                        };
                        colors.enabled = enabled;
                        chrome.storage.local.set({ progressBarColors: colors });
                    });
                });
            }
        }, 200);
    }
    if (progressColorInput) {
        progressColorInput.addEventListener("input", (e) => {
            chrome.storage.local.get(["progressBarColors"], (result) => {
                const colors = result.progressBarColors || {
                    progressColor: "#ff0000",
                    scrubberColor: "#ff0000",
                    bufferColor: "#ffffff",
                    enabled: true
                };
                colors.progressColor = e.target.value;
                chrome.storage.local.set({ progressBarColors: colors });
            });
        });
    }
    // Переключение между цветом и изображением для точки воспроизведения
    if (scrubberTypeColor && scrubberTypeImage) {
        const handleScrubberTypeChange = (type) => {
            if (type === "color") {
                if (scrubberColorContainer) scrubberColorContainer.style.display = "block";
                if (scrubberImageContainer) scrubberImageContainer.style.display = "none";
            } else {
                if (scrubberColorContainer) scrubberColorContainer.style.display = "none";
                if (scrubberImageContainer) scrubberImageContainer.style.display = "block";
            }
            chrome.storage.local.get(["progressBarColors"], (result) => {
                const colors = result.progressBarColors || {
                    progressColor: "#ff0000",
                    scrubberColor: "#ff0000",
                    scrubberImage: null,
                    scrubberType: "color",
                    bufferColor: "#ffffff",
                    enabled: true
                };
                colors.scrubberType = type;
                chrome.storage.local.set({ progressBarColors: colors });
            });
        };
        
        scrubberTypeColor.addEventListener("change", (e) => {
            if (e.target.checked) handleScrubberTypeChange("color");
        });
        scrubberTypeImage.addEventListener("change", (e) => {
            if (e.target.checked) handleScrubberTypeChange("image");
        });
    }
    
    if (scrubberColorInput) {
        scrubberColorInput.addEventListener("input", (e) => {
            chrome.storage.local.get(["progressBarColors"], (result) => {
                const colors = result.progressBarColors || {
                    progressColor: "#ff0000",
                    scrubberColor: "#ff0000",
                    bufferColor: "#ffffff",
                    enabled: true
                };
                colors.scrubberColor = e.target.value;
                chrome.storage.local.set({ progressBarColors: colors });
            });
        });
    }
    
    // Обработка загрузки изображения для точки воспроизведения
    if (scrubberImageInput) {
        scrubberImageInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file && file.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const imageDataUrl = event.target.result;
                    // Показываем превью
                    if (scrubberImagePreview) {
                        scrubberImagePreview.innerHTML = `<img src="${imageDataUrl}" style="max-width: 100%; max-height: 100px; border-radius: 4px;" />`;
                    }
                    if (removeScrubberImageBtn) {
                        removeScrubberImageBtn.style.display = "block";
                    }
                    // Сохраняем в storage
                    chrome.storage.local.get(["progressBarColors"], (result) => {
                        const colors = result.progressBarColors || {
                            progressColor: "#ff0000",
                            scrubberColor: "#ff0000",
                            scrubberImage: null,
                            scrubberImageSize: 40,
                            scrubberType: "color",
                            bufferColor: "#ffffff",
                            enabled: true
                        };
                        colors.scrubberImage = imageDataUrl;
                        colors.scrubberType = "image";
                        // Устанавливаем размер по умолчанию, если его нет
                        if (!colors.scrubberImageSize) {
                            colors.scrubberImageSize = 40;
                        }
                        chrome.storage.local.set({ progressBarColors: colors });
                        // Обновляем радио-кнопку и ползунок размера
                        if (scrubberTypeImage) scrubberTypeImage.checked = true;
                        if (scrubberTypeColor) scrubberTypeColor.checked = false;
                        if (scrubberColorContainer) scrubberColorContainer.style.display = "none";
                        if (scrubberImageContainer) scrubberImageContainer.style.display = "block";
                        if (scrubberImageSizeInput) {
                            scrubberImageSizeInput.value = colors.scrubberImageSize || 40;
                        }
                        if (scrubberImageSizeValue) {
                            scrubberImageSizeValue.textContent = colors.scrubberImageSize || 40;
                        }
                    });
                };
                reader.readAsDataURL(file);
            } else {
                if (errMsg) {
                    errMsg.innerText = "Пожалуйста, выберите изображение";
                    setTimeout(() => (errMsg.innerText = ""), 3000);
                }
            }
        });
    }
    
    // Удаление изображения точки воспроизведения
    if (removeScrubberImageBtn) {
        removeScrubberImageBtn.addEventListener("click", () => {
            if (scrubberImagePreview) {
                scrubberImagePreview.innerHTML = '<span style="color: var(--text-secondary); font-size: 0.85rem;">Превью изображения</span>';
            }
            if (scrubberImageInput) {
                scrubberImageInput.value = "";
            }
            if (removeScrubberImageBtn) {
                removeScrubberImageBtn.style.display = "none";
            }
            chrome.storage.local.get(["progressBarColors"], (result) => {
                const colors = result.progressBarColors || {
                    progressColor: "#ff0000",
                    scrubberColor: "#ff0000",
                    bufferColor: "#ffffff",
                    enabled: true
                };
                colors.scrubberImage = null;
                colors.scrubberType = "color";
                chrome.storage.local.set({ progressBarColors: colors });
                // Переключаем на цвет
                if (scrubberTypeColor) scrubberTypeColor.checked = true;
                if (scrubberTypeImage) scrubberTypeImage.checked = false;
                if (scrubberColorContainer) scrubberColorContainer.style.display = "block";
                if (scrubberImageContainer) scrubberImageContainer.style.display = "none";
            });
        });
    }
    
    // Обработка изменения размера изображения точки воспроизведения
    if (scrubberImageSizeInput) {
        scrubberImageSizeInput.addEventListener("input", (e) => {
            const size = parseInt(e.target.value);
            if (scrubberImageSizeValue) {
                scrubberImageSizeValue.textContent = size;
            }
            chrome.storage.local.get(["progressBarColors"], (result) => {
                const colors = result.progressBarColors || {
                    progressColor: "#ff0000",
                    scrubberColor: "#ff0000",
                    scrubberImage: null,
                    scrubberImageSize: 40,
                    scrubberType: "color",
                    bufferColor: "#ffffff",
                    enabled: true
                };
                colors.scrubberImageSize = size;
                chrome.storage.local.set({ progressBarColors: colors });
            });
        });
    }
    if (bufferColorInput) {
        bufferColorInput.addEventListener("input", (e) => {
            chrome.storage.local.get(["progressBarColors"], (result) => {
                const colors = result.progressBarColors || {
                    progressColor: "#ff0000",
                    scrubberColor: "#ff0000",
                    bufferColor: "#ffffff",
                    enabled: true
                };
                colors.bufferColor = e.target.value;
                chrome.storage.local.set({ progressBarColors: colors });
            });
        });
    }
    if (resetProgressColorsBtn) {
        resetProgressColorsBtn.addEventListener("click", () => {
            const defaultColors = {
                progressColor: "#ff0000",
                scrubberColor: "#ff0000",
                scrubberImage: null,
                scrubberImageSize: 40,
                scrubberType: "color",
                bufferColor: "#ffffff",
                enabled: progressBarEnabled ? progressBarEnabled.checked : true
            };
            chrome.storage.local.set({ progressBarColors: defaultColors });
            if (progressColorInput) progressColorInput.value = defaultColors.progressColor;
            if (scrubberColorInput) scrubberColorInput.value = defaultColors.scrubberColor;
            if (bufferColorInput) bufferColorInput.value = defaultColors.bufferColor;
            // Сброс типа точки воспроизведения
            if (scrubberTypeColor) scrubberTypeColor.checked = true;
            if (scrubberTypeImage) scrubberTypeImage.checked = false;
            if (scrubberColorContainer) scrubberColorContainer.style.display = "block";
            if (scrubberImageContainer) scrubberImageContainer.style.display = "none";
            if (scrubberImagePreview) {
                scrubberImagePreview.innerHTML = '<span style="color: var(--text-secondary); font-size: 0.85rem;">Превью изображения</span>';
            }
            if (scrubberImageInput) scrubberImageInput.value = "";
            if (removeScrubberImageBtn) removeScrubberImageBtn.style.display = "none";
            // Сброс размера изображения
            if (scrubberImageSizeInput) scrubberImageSizeInput.value = 40;
            if (scrubberImageSizeValue) scrubberImageSizeValue.textContent = "40";
        });
    }
    // Hide Controls Toggle
    if (hideControlsEnabled) {
        hideControlsEnabled.addEventListener("change", (e) => {
            const enabled = e.target.checked;
            chrome.storage.local.set({ hideControlsEnabled: enabled });
        });
    }
    // Hide Controls Shortcut - запись комбинации клавиш
    if (hideControlsShortcut) {
        let isRecording = false;
        
        // При фокусе на поле начинаем запись
        hideControlsShortcut.addEventListener("focus", function(e) {
            isRecording = true;
            hideControlsShortcut.value = "";
            hideControlsShortcut.placeholder = "Нажмите комбинацию клавиш...";
        });
        
        // При потере фокуса прекращаем запись
        hideControlsShortcut.addEventListener("blur", function() {
            isRecording = false;
        });
        
        // Записываем комбинацию клавиш
        hideControlsShortcut.addEventListener("keydown", function(e) {
            if (!isRecording) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            // Игнорируем клавиши, которые используются для навигации
            if (e.key === 'Tab') {
                return; // Разрешаем Tab для выхода из поля
            }
            
            // Собираем комбинацию клавиш
            const keys = [];
            if (e.ctrlKey) keys.push('ctrl');
            if (e.shiftKey) keys.push('shift');
            if (e.altKey) keys.push('alt');
            if (e.metaKey) keys.push('meta');
            
            // Добавляем основную клавишу (если это не модификатор)
            const key = e.key.toLowerCase();
            if (key && !['control', 'shift', 'alt', 'meta', 'capslock', 'tab'].includes(key)) {
                keys.push(key);
                
                // Минимум должна быть одна клавиша
                if (keys.length > 0) {
                    // Форматируем и отображаем комбинацию
                    const keysStr = keys.join('+');
                    hideControlsShortcut.value = keysStr;
                    
                    // Сохраняем в storage
                    chrome.storage.local.set({ hideControlsShortcut: keys });
                    
                    // Убираем фокус после записи
                    setTimeout(() => {
                        hideControlsShortcut.blur();
                    }, 100);
                }
            }
        });
        
        // Предотвращаем обычный ввод текста
        hideControlsShortcut.addEventListener("keypress", function(e) {
            if (isRecording) {
                e.preventDefault();
            }
        });
        
        // Предотвращаем ввод текста через paste
        hideControlsShortcut.addEventListener("paste", function(e) {
            e.preventDefault();
        });
        
        // Обработчик для случая, если пользователь все же введет текст вручную (резервный)
        hideControlsShortcut.addEventListener("change", handleShortcutInputChange(hideControlsShortcut, "hideControlsShortcut", "shift+h"));
    }
    // Listen for storage changes to update UI
    chrome.storage.onChanged.addListener((changes) => {
        if (changes["applicationIsOn"]?.newValue !== undefined && statusToggle) {
            statusToggle.checked = changes["applicationIsOn"].newValue;
        }
        if (changes["hideControlsEnabled"]?.newValue !== undefined && hideControlsEnabled) {
            hideControlsEnabled.checked = changes["hideControlsEnabled"].newValue;
        }
        if (changes["progressBarColors"]?.newValue !== undefined) {
            const colors = changes["progressBarColors"].newValue;
            if (progressBarEnabled) progressBarEnabled.checked = colors.enabled || false;
            if (progressBarSettings) progressBarSettings.style.display = (colors.enabled || false) ? "block" : "none";
            if (progressColorInput) progressColorInput.value = colors.progressColor || "#ff0000";
            
            // Обновление типа точки воспроизведения
            const scrubberType = colors.scrubberType || "color";
            if (scrubberTypeColor) scrubberTypeColor.checked = scrubberType === "color";
            if (scrubberTypeImage) scrubberTypeImage.checked = scrubberType === "image";
            
            if (scrubberType === "color") {
                if (scrubberColorContainer) scrubberColorContainer.style.display = "block";
                if (scrubberImageContainer) scrubberImageContainer.style.display = "none";
                if (scrubberColorInput) scrubberColorInput.value = colors.scrubberColor || "#ff0000";
            } else {
                if (scrubberColorContainer) scrubberColorContainer.style.display = "none";
                if (scrubberImageContainer) scrubberImageContainer.style.display = "block";
                if (colors.scrubberImage && scrubberImagePreview) {
                    scrubberImagePreview.innerHTML = `<img src="${colors.scrubberImage}" style="max-width: 100%; max-height: 100px; border-radius: 4px;" />`;
                    if (removeScrubberImageBtn) removeScrubberImageBtn.style.display = "block";
                }
                // Загружаем размер изображения
                const imageSize = colors.scrubberImageSize || 40;
                if (scrubberImageSizeInput) {
                    scrubberImageSizeInput.value = imageSize;
                }
                if (scrubberImageSizeValue) {
                    scrubberImageSizeValue.textContent = imageSize;
                }
            }
            
            if (bufferColorInput) {
                let bufferColor = colors.bufferColor || "#ffffff";
                // Конвертируем старый формат с альфа-каналом в обычный hex
                if (bufferColor.length === 9 && bufferColor.includes('33')) {
                    bufferColor = "#ffffff";
                }
                bufferColorInput.value = bufferColor;
            }
        }
    });
}
function handleListInputChange(element, storageKey) {
    return () => {
        const value = element.value
            .trim()
            .split(/\s*,\s*/)
            .map((v) => v.trim()) // Trim each item
            .filter((v) => v); // Remove empty strings
        chrome.storage.local.set({ [storageKey]: value });
    };
}
function handleShortcutInputChange(element, storageKey, defaultValue) {
    return () => {
        const value = element.value
            .trim()
            .toLowerCase()
            .split(/\s*\+\s*/)
            .filter((v) => v);
        if (!value.length) {
            // Optional: reset to default or show error
            // chrome.storage.local.set({ [storageKey]: defaultValue.split('+') });
            // element.value = defaultValue;
            return;
        }
        chrome.storage.local.set({ [storageKey]: value });
        element.value = value.join("+"); // Standardize format
    };
}
function handleSelectChange(storageKey) {
    return (e) => {
        chrome.storage.local.set({ [storageKey]: e.target.value });
    };
}
function handleNumericInputChange(storageKey) {
    return (e) => {
        let value = e.target.value.trim().toLowerCase();
        let storageValue = "none"; // Default to 'none'
        if (value === "" || value === "none") {
            storageValue = "none";
            e.target.value = ""; // Clear input if set to none/empty
        }
        else {
            // Basic check if it looks like a number or has k/m suffix
            // More robust parsing could be added (like in content.js)
            if (/^(\d+(\.\d+)?|\d+)[km]?$/.test(value) ||
                /^\d+$/.test(value.replace(/[,_]/g, ""))) {
                storageValue = value; // Store the user's input format (like 50k)
            }
            else {
                // Invalid format, treat as 'none'
                storageValue = "none";
                e.target.value = ""; // Clear invalid input
                errMsg.innerText = `Invalid number format for ${storageKey}. Use numbers, k, or m.`;
                setTimeout(() => (errMsg.innerText = ""), 3000); // Clear error message
            }
        }
        chrome.storage.local.set({ [storageKey]: storageValue });
    };
}
function handleIntegerInputChange(storageKey, defaultValue) {
    return (e) => {
        const value = parseInt(e.target.value, 10);
        if (isNaN(value) || value < (e.target.min || 0)) {
            chrome.storage.local.set({ [storageKey]: defaultValue });
            e.target.value = defaultValue.toString(); // Reset to default if invalid
        }
        else {
            chrome.storage.local.set({ [storageKey]: value });
            e.target.value = value.toString(); // Ensure it's displayed as a clean number
        }
    };
}
function handleCheckboxChange(storageKey) {
    return (e) => {
        chrome.storage.local.set({ [storageKey]: e.target.checked });
    };
}
function getAllSettingsForPopup() {
    const keysToGet = [
        "applicationIsOn",
        "shortCutKeys",
        "shortCutInteractKeys",
        "filteredAuthors",
        "whitelistedAuthors",
        "filteredTags",
        "filterByMinLength",
        "filterByMaxLength",
        "filterByMinViews",
        "filterByMaxViews",
        "filterByMinLikes",
        "filterByMaxLikes",
        "filterByMinComments",
        "filterByMaxComments",
        "scrollDirection",
        "amountOfPlaysToSkip",
        "scrollOnComments",
        "scrollOnNoTags",
        "additionalScrollDelay",
        "shortsSpeedEnabled",
        "shortsSelectedSpeed",
        "shortsSpeedShortcut",
        "shortsScrollEnabled",
        "shortsScrollDownShortcut",
        "shortsScrollUpShortcut",
        "normalVideoSpeedEnabled",
        "normalVideoSpeedShortcut",
        "progressBarColors",
        "hideControlsEnabled",
        "hideControlsShortcut",
    ];
    chrome.storage.local.get(keysToGet, (result) => {
        // Master Status Toggle
        if (statusToggle) {
            statusToggle.checked = result.applicationIsOn ?? true;
        }
        // Shortcuts
        if (shortCutInput) {
            shortCutInput.value = (result.shortCutKeys ?? ["shift", "d"]).join("+");
        }
        if (shortCutInteractInput) {
            shortCutInteractInput.value = (result.shortCutInteractKeys ?? ["shift", "g"]).join("+");
        }
        // Lists (Authors/Tags)
        if (filteredAuthorsInput) {
            filteredAuthorsInput.value = (result.filteredAuthors ?? ["Tyson3101"]).join(",");
        }
        if (whitelistedAuthorsInput) {
            whitelistedAuthorsInput.value = (result.whitelistedAuthors ?? ["Tyson3101"]).join(",");
        }
        if (filteredTagsInput) {
            filteredTagsInput.value = (result.filteredTags ?? ["#nsfw", "#leagueoflegends"]).join(",");
        }
        // Filters
        if (filterByMinLengthInput) {
            filterByMinLengthInput.value = result.filterByMinLength ?? "none";
        }
        if (filterByMaxLengthInput) {
            filterByMaxLengthInput.value = result.filterByMaxLength ?? "none";
        }
        if (filterByMinViewsInput) {
            filterByMinViewsInput.value = result.filterByMinViews === "none" || result.filterByMinViews === undefined ? "" : result.filterByMinViews;
        }
        if (filterByMaxViewsInput) {
            filterByMaxViewsInput.value = result.filterByMaxViews === "none" || result.filterByMaxViews === undefined ? "" : result.filterByMaxViews;
        }
        if (filterByMinLikesInput) {
            filterByMinLikesInput.value = result.filterByMinLikes === "none" || result.filterByMinLikes === undefined ? "" : result.filterByMinLikes;
        }
        if (filterByMaxLikesInput) {
            filterByMaxLikesInput.value = result.filterByMaxLikes === "none" || result.filterByMaxLikes === undefined ? "" : result.filterByMaxLikes;
        }
        if (filterByMinCommentsInput) {
            filterByMinCommentsInput.value = result.filterByMinComments === "none" || result.filterByMinComments === undefined ? "" : result.filterByMinComments;
        }
        if (filterByMaxCommentsInput) {
            filterByMaxCommentsInput.value = result.filterByMaxComments === "none" || result.filterByMaxComments === undefined ? "" : result.filterByMaxComments;
        }
        // General Settings
        if (scrollDirectionInput) {
            scrollDirectionInput.value = result.scrollDirection ?? "down";
        }
        if (amountOfPlaysInput) {
            amountOfPlaysInput.value = (result.amountOfPlaysToSkip ?? 1).toString();
        }
        if (additionalScrollDelayInput) {
            additionalScrollDelayInput.value = (result.additionalScrollDelay ?? 0).toString();
        }
        if (scrollOnCommentsInput) {
            scrollOnCommentsInput.checked = result.scrollOnComments ?? false;
        }
        if (scrollOnNoTagsInput) {
            scrollOnNoTagsInput.checked = result.scrollOnNoTags ?? false;
        }
        // Shorts Speed Enabled
        if (shortsSpeedEnabled) {
            shortsSpeedEnabled.checked = result.shortsSpeedEnabled ?? true;
        }
        // Shorts Speed Select
        if (shortsSpeedSelect) {
            shortsSpeedSelect.value = (result.shortsSelectedSpeed ?? 2).toString();
        }
        // Shorts Speed Shortcut
        if (shortsSpeedShortcut) {
            shortsSpeedShortcut.value = (result.shortsSpeedShortcut ?? ["shift", "s"]).join("+");
        }
        // Shorts Scroll Enabled
        if (shortsScrollEnabled) {
            shortsScrollEnabled.checked = result.shortsScrollEnabled ?? true;
        }
        // Shorts Scroll Down Shortcut
        if (shortsScrollDownShortcut) {
            shortsScrollDownShortcut.value = (result.shortsScrollDownShortcut ?? ["d"]).join("+");
        }
        // Shorts Scroll Up Shortcut
        if (shortsScrollUpShortcut) {
            shortsScrollUpShortcut.value = (result.shortsScrollUpShortcut ?? ["e"]).join("+");
        }
        // Normal Video Speed Enabled
        if (normalVideoSpeedEnabled) {
            normalVideoSpeedEnabled.checked = result.normalVideoSpeedEnabled ?? true;
        }
        // Normal Video Speed Shortcut
        if (normalVideoSpeedShortcut) {
            normalVideoSpeedShortcut.value = (result.normalVideoSpeedShortcut ?? ["shift", "s"]).join("+");
        }
        // Progress Bar Settings
        const progressBarColors = result.progressBarColors || {
            progressColor: "#ff0000",
            scrubberColor: "#ff0000",
            bufferColor: "#ffffff",
            enabled: false
        };
        console.log("[YT+] Loading progress bar settings:", progressBarColors);
        if (progressBarEnabled) {
            progressBarEnabled.checked = progressBarColors.enabled || false;
            console.log("[YT+] Progress bar enabled checkbox set to:", progressBarEnabled.checked);
        } else {
            console.error("[YT+] progressBarEnabled element not found in getAllSettingsForPopup!");
        }
        if (progressBarSettings) {
            const isEnabled = progressBarColors.enabled || false;
            progressBarSettings.style.display = isEnabled ? "block" : "none";
            console.log("[YT+] Progress bar settings panel visibility:", progressBarSettings.style.display);
        } else {
            console.error("[YT+] progressBarSettings element not found in getAllSettingsForPopup!");
        }
        if (progressColorInput) {
            progressColorInput.value = progressBarColors.progressColor || "#ff0000";
        }
        if (scrubberColorInput) {
            scrubberColorInput.value = progressBarColors.scrubberColor || "#ff0000";
        }
        if (bufferColorInput) {
            // Конвертируем старый формат с альфа-каналом в обычный hex
            let bufferColor = progressBarColors.bufferColor || "#ffffff";
            if (bufferColor.length === 9 && bufferColor.includes('33')) {
                bufferColor = "#ffffff";
            }
            bufferColorInput.value = bufferColor;
        }
        // Hide Controls Enabled
        if (hideControlsEnabled) {
            hideControlsEnabled.checked = result.hideControlsEnabled || false;
        }
        // Hide Controls Shortcut
        if (hideControlsShortcut) {
            hideControlsShortcut.value = (result.hideControlsShortcut ?? ["shift", "h"]).join("+");
        }
        // Initialize default values in storage if they were undefined
        const defaultsToSet = {};
        if (result.applicationIsOn === undefined) defaultsToSet.applicationIsOn = true;
        if (result.shortCutKeys === undefined) defaultsToSet.shortCutKeys = ["shift", "d"];
        if (result.shortCutInteractKeys === undefined) defaultsToSet.shortCutInteractKeys = ["shift", "g"];
        if (result.filteredAuthors === undefined) defaultsToSet.filteredAuthors = ["Tyson3101"];
        if (result.whitelistedAuthors === undefined) defaultsToSet.whitelistedAuthors = [];
        if (result.filteredTags === undefined) defaultsToSet.filteredTags = ["#nsfw", "#leagueoflegends"];
        if (result.filterByMinLength === undefined) defaultsToSet.filterByMinLength = "none";
        if (result.filterByMaxLength === undefined) defaultsToSet.filterByMaxLength = "none";
        if (result.filterByMinViews === undefined) defaultsToSet.filterByMinViews = "none";
        if (result.filterByMaxViews === undefined) defaultsToSet.filterByMaxViews = "none";
        if (result.filterByMinLikes === undefined) defaultsToSet.filterByMinLikes = "none";
        if (result.filterByMaxLikes === undefined) defaultsToSet.filterByMaxLikes = "none";
        if (result.filterByMinComments === undefined) defaultsToSet.filterByMinComments = "none";
        if (result.filterByMaxComments === undefined) defaultsToSet.filterByMaxComments = "none";
        if (result.scrollDirection === undefined) defaultsToSet.scrollDirection = "down";
        if (result.amountOfPlaysToSkip === undefined) defaultsToSet.amountOfPlaysToSkip = 1;
        if (result.scrollOnComments === undefined) defaultsToSet.scrollOnComments = false;
        if (result.scrollOnNoTags === undefined) defaultsToSet.scrollOnNoTags = false;
        if (result.additionalScrollDelay === undefined) defaultsToSet.additionalScrollDelay = 0;
        if (result.shortsSelectedSpeed === undefined) defaultsToSet.shortsSelectedSpeed = 2;
        if (result.shortsSpeedEnabled === undefined) defaultsToSet.shortsSpeedEnabled = true;
        if (result.shortsSpeedShortcut === undefined) defaultsToSet.shortsSpeedShortcut = ["shift", "s"];
        if (result.shortsScrollDownShortcut === undefined) defaultsToSet.shortsScrollDownShortcut = ["d"];
        if (result.shortsScrollUpShortcut === undefined) defaultsToSet.shortsScrollUpShortcut = ["e"];
        if (result.normalVideoSpeedEnabled === undefined) defaultsToSet.normalVideoSpeedEnabled = true;
        if (result.normalVideoSpeedShortcut === undefined) defaultsToSet.normalVideoSpeedShortcut = ["shift", "s"];
        if (result.progressBarColors === undefined) {
            defaultsToSet.progressBarColors = {
                progressColor: "#ff0000",
                scrubberColor: "#ff0000",
                scrubberImage: null,
                scrubberImageSize: 40,
                scrubberType: "color",
                bufferColor: "#ffffff",
                enabled: false
            };
        }
        if (result.hideControlsEnabled === undefined) defaultsToSet.hideControlsEnabled = false;
        if (result.hideControlsShortcut === undefined) defaultsToSet.hideControlsShortcut = ["shift", "h"];
        if (Object.keys(defaultsToSet).length > 0) {
            chrome.storage.local.set(defaultsToSet);
        }
    });
}
