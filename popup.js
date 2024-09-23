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
document.getElementById('imageUpload').addEventListener('change', function(event) {
    document.getElementById('imageUploadContainer').style.display = 'none';
    const reader = new FileReader();
    reader.onload = function() {
        const imageUrl = reader.result;
        chrome.storage.local.set({ userImage: imageUrl }, function() {
            const imageElement = document.getElementById('uploadedImage');
            imageElement.src = imageUrl;
            imageElement.hidden = false;
        });
    };
    reader.readAsDataURL(event.target.files[0]);
});

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

function makeApiCall(data) {
    document.getElementById('loadingIndicator').style.display = 'block';
    const postData = {
        model_image: data.userImage,
        garment_image: data.garmentUrl,
        category: data.garmentType,
        nsfw_filter: true,
        cover_feet: false,
        adjust_hands: false,
        restore_background: false,
        restore_clothes: false,
        guidance_scale: 2.5,
        timesteps: 50,
        seed: 42,
        num_samples: 1
    };

    fetch('https://myoutfitai-server.onrender.com/api/proxy', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
    }).then(response => response.json())
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
