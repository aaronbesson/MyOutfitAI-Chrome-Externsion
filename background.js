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
            console.log("Garment URL set:", info.srcUrl);
            chrome.runtime.sendMessage({ message: "garmentUrlSet" });
        });
    }
});
