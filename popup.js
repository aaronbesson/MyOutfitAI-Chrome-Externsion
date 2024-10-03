document.addEventListener('DOMContentLoaded', function() {
    // Check if API key is already saved and hide input if it is
    chrome.storage.local.get(['apiKey'], function(result) {
        if (result.apiKey) {
            document.getElementById('apiKey').style.display = 'none';
            document.getElementById('saveKey').style.display = 'none';
            document.getElementById('enterApi').style.display = 'none';
        }
    });
});

document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.local.get(['userImage', 'resultImage'], function(result) {
        if (result.resultImage) {  // Checks if there is a result image stored
            // Hide API key elements if not needed
            document.getElementById('apiKey').style.display = 'none';
            document.getElementById('saveKey').style.display = 'none';
            
            // Hide the original image upload elements
            document.getElementById('uploadedImage').style.display = 'none';  // Assuming this is where the original image is shown
            document.getElementById('imageUpload').style.display = 'none';
            document.getElementById('imageUploadContainer').style.display = 'none';
            
            // Optionally, display the result image
            var imgElement = document.getElementById('resultImage');
            imgElement.src = result.resultImage;
            imgElement.style.display = 'block';  // Make sure to display the result image
        }
    });
});



// Listening for messages from background.js
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.message === "garmentUrlSet") {
        checkDataAndMakeApiCall();
    }
});

document.getElementById('saveKey').addEventListener('click', function() {
    const apiKey = document.getElementById('apiKey').value;
    chrome.storage.local.set({ apiKey: apiKey }, function() {
        console.log('API Key saved');
    });
});

// Event listener for file upload
document.getElementById('imageUpload').addEventListener('change', async function(event) {
    document.getElementById('imageUploadContainer').style.display = 'none';
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = async function(e) {
            const originalImageUrl = e.target.result;
            const resizedImageBlob = await resizeImage(originalImageUrl, 288, 432);
            chrome.storage.local.set({ userImage: URL.createObjectURL(resizedImageBlob) }, function() {
                const imageElement = document.getElementById('uploadedImage');
                imageElement.src = URL.createObjectURL(resizedImageBlob);
                imageElement.hidden = false;
            });
        };
        reader.readAsDataURL(file);
    }
});

// Update the resizeImage function
function resizeImage(imgDataUrl, targetWidth, targetHeight) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
            canvas.toBlob((blob) => {
                resolve(blob);
            }, 'image/jpeg', 0.7); // Reduced quality to 0.7
        };
        img.src = imgDataUrl;
    });
}

// Event listener for loading the popup
document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.local.get('userImage', function(result) {
        if (result.userImage) {
            const imageElement = document.getElementById('uploadedImage');
            imageElement.src = result.userImage;
            imageElement.hidden = false;
        }
    });
});



document.getElementById('garmentType').addEventListener('change', function() {
    const garmentType = this.value;
    chrome.storage.local.set({ garmentType: garmentType });
});


function checkDataAndMakeApiCall() {
    chrome.storage.local.get(['userImage', 'garmentType', 'garmentUrl'], function(data) {
        if (data.userImage && data.garmentType && data.garmentUrl) {
            makeApiCall(data);
        } else {
            console.error("Data missing: ", data);
        }
    });
}

// Update the makeApiCall function
function makeApiCall(data) {
    document.getElementById('loadingIndicator').style.display = 'block';

    const formData = new FormData();
    formData.append('category', data.garmentType);
    formData.append('nsfw_filter', 'true');
    formData.append('cover_feet', 'false');
    formData.append('adjust_hands', 'false');
    formData.append('restore_background', 'false');
    formData.append('restore_clothes', 'false');
    formData.append('guidance_scale', '2.5');
    formData.append('timesteps', '50');
    formData.append('seed', '42');
    formData.append('num_samples', '1');

    // Convert base64 to Blob and append to FormData
    fetch(data.userImage)
        .then(res => res.blob())
        .then(blob => {
            formData.append('model_image', blob, 'model.jpg');
            return fetch(data.garmentUrl);
        })
        .then(res => res.blob())
        .then(blob => {
            formData.append('garment_image', blob, 'garment.jpg');

            return fetch('https://myoutfitai-server.onrender.com/api/proxy', {
                method: 'POST',
                body: formData
            });
        })
        .then(response => response.json())
        .then(responseData => {
            console.log(responseData);
            if (responseData && responseData.output && responseData.output.length > 0) {
                const imageUrl = responseData.output[0];
                const imageElement = document.getElementById('resultImage');
                const viewButton = document.getElementById('viewImageBtn');
        
                imageElement.src = imageUrl;
                imageElement.hidden = false;
                viewButton.style.display = 'block';
                document.getElementById('loadingIndicator').style.display = 'none';

                // Store the result image
                chrome.storage.local.set({ resultImage: imageUrl });
            } else {
                console.error('API Response Error: ', responseData);
                document.getElementById('loadingIndicator').style.display = 'none';
            }
        }).catch(error => {
            console.error('Fetch Error:', error);
            document.getElementById('loadingIndicator').style.display = 'none';
        });
}
