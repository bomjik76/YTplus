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
// Navigation Elements
const navItems = document.querySelectorAll(".nav-item");
const contentPanels = document.querySelectorAll(".content-panel");
// Call Functions
document.addEventListener('DOMContentLoaded', () => {
    getAllSettingsForPopup();
    setupNavigation();
    setupEventListeners();
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
    // Listen for storage changes to update UI
    chrome.storage.onChanged.addListener((changes) => {
        if (changes["applicationIsOn"]?.newValue !== undefined && statusToggle) {
            statusToggle.checked = changes["applicationIsOn"].newValue;
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
        if (Object.keys(defaultsToSet).length > 0) {
            chrome.storage.local.set(defaultsToSet);
        }
    });
}
