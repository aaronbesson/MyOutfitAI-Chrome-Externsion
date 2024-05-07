chrome.runtime.onInstalled.addListener(function() {
    chrome.contextMenus.create({
        id: "setGarment",
        title: "Swap Outfit",
        contexts: ["image"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "setGarment") {
        chrome.storage.local.set({ garmentUrl: info.srcUrl }, function() {
            console.log("Garment URL set:", info.srcUrl);  // Debugging statement
            // Notify the popup script to check data and possibly make an API call
            chrome.runtime.sendMessage({ message: "garmentUrlSet" });
        });
    }
});
