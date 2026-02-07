/**
 * YT+ i18n - Локализация расширения (English / Русский)
 */
const TRANSLATIONS = {
  en: {
    toggleExtensionTitle: "Toggle Extension On/Off",
    shortsSpeedLabel: "Shorts playback speed",
    enable: "Enable",
    shortsSpeedDesc: "Enable speed control for Shorts playback",
    speedLabel: "Speed",
    speedDesc: "Select speed for Shorts. Use on-screen button to toggle.",
    shortcutSpeedLabel: "Hotkey for speed toggle",
    shortcutPlaceholder: "Press key combination...",
    shortcutDesc: "Click field and press key combination (e.g.: Shift+S, Ctrl+K)",
    shortsScrollLabel: "Shorts scroll with keyboard",
    shortsScrollDesc: "Enable Shorts navigation with hotkeys",
    scrollDownLabel: "Hotkey for scroll down (next Short)",
    scrollDownDesc: "Click field and press key combination (e.g.: D, В)",
    scrollUpLabel: "Hotkey for scroll up (previous Short)",
    scrollUpDesc: "Click field and press key combination (e.g.: E, У)",
    normalVideoSpeedLabel: "Normal video playback speed",
    normalVideoSpeedDesc: "Enable speed control for regular videos",
    progressBarLabel: "Custom progress bar",
    progressColorLabel: "Progress bar color",
    progressColorDesc: "Color of the filled part of progress bar",
    scrubberLabel: "Playback position indicator",
    colorOption: "Color",
    imageOption: "Image",
    scrubberColorDesc: "Color of the scrubber (indicator) on progress bar",
    scrubberImagePreview: "Image preview",
    scrubberImageSizeLabel: "Image size:",
    scrubberImageSizeDesc: "Size in pixels (20px - 150px). Image scales independently.",
    removeImageBtn: "Remove image",
    scrubberImageDesc: "Image for playback indicator (recommended square, up to 100x100px)",
    bufferColorLabel: "Buffer color (optional)",
    bufferColorDesc: "Color of loaded video part (applied with 20% opacity)",
    resetColorsBtn: "Reset to default colors",
    hideControlsLabel: "Hide playback controls",
    hideControlsDesc: "Enable hiding controls with hotkey. Use assigned key combination to toggle.",
    hideControlsShortcutLabel: "Hotkey for toggle",
    selectLanguage: "Select language",
    english: "English",
    russian: "Русский",
    onlyOnYoutube: "Can only be toggled on YouTube!",
    selectImage: "Please select an image",
  },
  ru: {
    toggleExtensionTitle: "Включить/выключить расширение",
    shortsSpeedLabel: "Ускорение воспроизведения Shorts",
    enable: "Включить",
    shortsSpeedDesc: "Включить возможность ускорения воспроизведения Shorts",
    speedLabel: "Скорость ускорения",
    speedDesc: "Выберите скорость для ускорения Shorts. Переключить скорость можно кнопкой на экране.",
    shortcutSpeedLabel: "Горячие клавиши для переключения скорости",
    shortcutPlaceholder: "Нажмите комбинацию клавиш...",
    shortcutDesc: "Кликните в поле и нажмите комбинацию клавиш для записи (например: Shift+S, Ctrl+K)",
    shortsScrollLabel: "Прокрутка Shorts клавишами",
    shortsScrollDesc: "Включить возможность прокрутки Shorts с помощью горячих клавиш",
    scrollDownLabel: "Горячие клавиши для прокрутки вниз (следующий Short)",
    scrollDownDesc: "Кликните в поле и нажмите комбинацию клавиш для записи (например: D, В)",
    scrollUpLabel: "Горячие клавиши для прокрутки вверх (предыдущий Short)",
    scrollUpDesc: "Кликните в поле и нажмите комбинацию клавиш для записи (например: E, У)",
    normalVideoSpeedLabel: "Ускорение воспроизведения обычных видео",
    normalVideoSpeedDesc: "Включить возможность ускорения воспроизведения обычных видео",
    progressBarLabel: "Кастомный прогресс-бар",
    progressColorLabel: "Цвет прогресс-бара",
    progressColorDesc: "Цвет заполненной части прогресс-бара",
    scrubberLabel: "Точка воспроизведения",
    colorOption: "Цвет",
    imageOption: "Изображение",
    scrubberColorDesc: "Цвет ползунка (точки) на прогресс-баре",
    scrubberImagePreview: "Превью изображения",
    scrubberImageSizeLabel: "Размер изображения:",
    scrubberImageSizeDesc: "Размер изображения в пикселях (20px - 150px). Изображение накладывается независимо от размера точки",
    removeImageBtn: "Удалить изображение",
    scrubberImageDesc: "Изображение для точки воспроизведения (рекомендуется квадратное, до 100x100px)",
    bufferColorLabel: "Цвет буфера (опционально)",
    bufferColorDesc: "Цвет загруженной части видео (применяется с прозрачностью 20%)",
    resetColorsBtn: "Сбросить к стандартным цветам",
    hideControlsLabel: "Отключить элементы управления воспроизведением",
    hideControlsDesc: "Включить возможность скрывать элементы управления через горячие клавиши. Используйте заданную комбинацию клавиш для переключения скрытия.",
    hideControlsShortcutLabel: "Горячие клавиши для переключения",
    selectLanguage: "Выберите язык",
    english: "English",
    russian: "Русский",
    onlyOnYoutube: "Можно переключать только на YouTube!",
    selectImage: "Пожалуйста, выберите изображение",
  }
};

let currentLocale = "ru";

function t(key) {
  return TRANSLATIONS[currentLocale]?.[key] ?? TRANSLATIONS.en[key] ?? key;
}

function applyTranslations(locale) {
  currentLocale = locale || "ru";
  const tr = TRANSLATIONS[currentLocale];

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (tr?.[key]) {
      el.textContent = tr[key];
    }
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (tr?.[key]) {
      el.placeholder = tr[key];
    }
  });

  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title");
    if (tr?.[key]) {
      el.title = tr[key];
    }
  });

  chrome.storage.local.set({ locale: currentLocale });
  updateLangSwitcher();
}

function updateLangSwitcher() {
  const enBtn = document.getElementById("lang-switch-en");
  const ruBtn = document.getElementById("lang-switch-ru");
  if (enBtn) enBtn.classList.toggle("active", currentLocale === "en");
  if (ruBtn) ruBtn.classList.toggle("active", currentLocale === "ru");
}

function setupLangSwitcher() {
  document.getElementById("lang-switch-en")?.addEventListener("click", () => applyTranslations("en"));
  document.getElementById("lang-switch-ru")?.addEventListener("click", () => applyTranslations("ru"));
  updateLangSwitcher();
}

function showLanguageSelector() {
  const main = document.getElementById("popup-main");
  const langSelector = document.getElementById("lang-selector");
  if (main) main.style.display = "none";
  if (langSelector) {
    langSelector.style.display = "flex";
    // Билингвальный заголовок при первом показе
    const title = langSelector.querySelector(".lang-selector-title");
    if (title) title.textContent = "Select language / Выберите язык";
  }
}

function showMainContent() {
  const main = document.getElementById("popup-main");
  const langSelector = document.getElementById("lang-selector");
  if (langSelector) langSelector.style.display = "none";
  if (main) main.style.display = "block";
}

function initI18n(onReady) {
  // Изначально скрываем main, пока не определим локаль
  const main = document.getElementById("popup-main");
  if (main) main.style.display = "none";

  chrome.storage.local.get(["locale"], (result) => {
    const locale = result.locale;
    if (!locale) {
      showLanguageSelector();
      document.getElementById("lang-en")?.addEventListener("click", () => {
        currentLocale = "en";
        applyTranslations("en");
        showMainContent();
        setupLangSwitcher();
        onReady?.();
      });
      document.getElementById("lang-ru")?.addEventListener("click", () => {
        currentLocale = "ru";
        applyTranslations("ru");
        showMainContent();
        setupLangSwitcher();
        onReady?.();
      });
    } else {
      currentLocale = locale;
      applyTranslations(locale);
      showMainContent();
      setupLangSwitcher();
      onReady?.();
    }
  });
}
