// Vercel Serverless Function - API Proxy for JSONBin
// This keeps your API key secure on the server

const BIN_ID = process.env.JSONBIN_BIN_ID;
const API_KEY = process.env.JSONBIN_API_KEY;
const BASE_URL = 'https://api.jsonbin.io/v3/b';

module.exports = async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (!BIN_ID || !API_KEY) {
        return res.status(500).json({ error: 'Server not configured - missing environment variables' });
    }

    try {
        if (req.method === 'GET') {
            // Fetch current data from JSONBin
            const response = await fetch(`${BASE_URL}/${BIN_ID}/latest`, {
                headers: {
                    'X-Master-Key': API_KEY
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch from JSONBin');
            }

            const data = await response.json();
            return res.status(200).json(data.record);

        } else if (req.method === 'PUT') {
            // Save data to JSONBin
            const response = await fetch(`${BASE_URL}/${BIN_ID}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': API_KEY
                },
                body: JSON.stringify(req.body)
            });

            if (!response.ok) {
                throw new Error('Failed to save to JSONBin');
            }

            const data = await response.json();
            return res.status(200).json({ success: true, record: data.record });

        } else {
            return res.status(405).json({ error: 'Method not allowed' });
        }

    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: error.message });
    }
};
