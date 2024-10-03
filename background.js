// Add this function to resize the image
function resizeImage(imgUrl, targetWidth, targetHeight) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
            canvas.toBlob((blob) => {
                resolve(URL.createObjectURL(blob));
            }, 'image/jpeg', 0.7); // Reduced quality to 0.7
        };
        img.onerror = reject;
        img.src = imgUrl;
    });
}

chrome.runtime.onInstalled.addListener(function() {
    chrome.contextMenus.create({
        id: "setGarment",
        title: "Swap Outfit",
        contexts: ["image"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "setGarment") {
        resizeImage(info.srcUrl, 288, 432).then(resizedImageUrl => {
            chrome.storage.local.set({ garmentUrl: resizedImageUrl }, function() {
                console.log("Garment URL set:", resizedImageUrl);
                chrome.runtime.sendMessage({ message: "garmentUrlSet" });
            });
        }).catch(error => {
            console.error("Error resizing image:", error);
        });
    }
});
