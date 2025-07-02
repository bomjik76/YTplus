const allStorageKeys = [
    "applicationIsOn",
    "scrollDirection",
    "amountOfPlaysToSkip"
];

chrome.runtime.onInstalled.addListener(() => {
    // Set default values
    chrome.storage.local.get(allStorageKeys, (result) => {
        if (result.applicationIsOn == undefined) {
            chrome.storage.local.set({ applicationIsOn: true });
        }
        if (result.scrollDirection == undefined) {
            chrome.storage.local.set({ scrollDirection: "down" });
        }
        if (result.amountOfPlaysToSkip == undefined) {
            chrome.storage.local.set({ amountOfPlaysToSkip: 1 });
        }
    });
});

chrome.runtime.onUpdateAvailable.addListener(() => {
    chrome.runtime.reload();
});
