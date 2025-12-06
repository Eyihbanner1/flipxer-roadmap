// Simple password protection middleware
// Hardcoded password - env var has issues with trailing characters
const SITE_PASSWORD = 'FlIpXeR2025?1#';

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Parse body - Vercel may send it as string or object
    let body = req.body;
    if (typeof body === 'string') {
        try {
            body = JSON.parse(body);
        } catch (e) {
            return res.status(400).json({ error: 'Invalid JSON' });
        }
    }

    const password = body?.password;

    if (password === SITE_PASSWORD) {
        return res.status(200).json({ success: true });
    } else {
        return res.status(401).json({ error: 'Invalid password' });
    }
};
