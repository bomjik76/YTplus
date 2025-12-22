const allStorageKeys = [
    "applicationIsOn",
    "scrollDirection",
    "amountOfPlaysToSkip",
    "progressBarColors"
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
        if (result.progressBarColors == undefined) {
            chrome.storage.local.set({
                progressBarColors: {
                    progressColor: "#ff0000",
                    scrubberColor: "#ff0000",
                    scrubberImage: null,
                    scrubberImageSize: 40,
                    scrubberType: "color",
                    bufferColor: "#ffffff",
                    enabled: false
                }
            });
        }
    });
});

chrome.runtime.onUpdateAvailable.addListener(() => {
    chrome.runtime.reload();
});
