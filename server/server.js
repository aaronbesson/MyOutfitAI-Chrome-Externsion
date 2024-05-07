// Import necessary modules
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();

// Define CORS options
const corsOptions = {
    origin: 'https://myoutfitai-server.onrender.com',
    methods: 'POST'
};

// Apply CORS with the specified options to all requests
app.use(cors(corsOptions));

// Enable CORS preflight for POST requests on /api/proxy
app.options('/api/proxy', cors(corsOptions)); 

// Middleware to parse JSON bodies
app.use(express.json());

// Define a POST route for the proxy endpoint
app.post('/api/proxy', async (req, res) => {
    try {
        const apiResponse = await fetch('https://api.replicate.com/v1/predictions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${req.body.apiKey}` // Pass the API key securely from your frontend
            },
            body: JSON.stringify(req.body.data) // Pass the data to the API
        });
        const initialResponse = await apiResponse.json();
        
        // Check if the response includes a URL to get the result
        if (initialResponse.urls && initialResponse.urls.get) {
            // Poll the URL to get the result
            const result = await pollForResult(initialResponse.urls.get, req.body.apiKey);
            res.json(result);
        } else {
            // If no URL is provided, return the initial response
            res.json(initialResponse);
        }
    } catch (error) {
        console.error('API request failed:', error);
        res.status(500).json({ error: 'Failed to fetch API' });
    }
});

// Function to poll for result
async function pollForResult(url, apiKey) {
    while (true) {
        const resultResponse = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });
        const resultData = await resultResponse.json();

        // Check if the task has completed or failed
        if (resultData.status === 'succeeded' || resultData.status === 'failed') {
            return resultData;
        }

        // Optionally, implement some delay here
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
    }
}

// Start the server on a specified port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));