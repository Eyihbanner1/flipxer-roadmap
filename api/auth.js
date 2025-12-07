// Secure password protection middleware using bcrypt
const bcrypt = require('bcryptjs');

// Password hash - the actual password is never stored in code
// To change password: generate new hash with bcrypt.hashSync('newpassword', 10)
const PASSWORD_HASH = '$2b$10$U/rE/pIzd6rqr6gNvwO6q.FIyzghPaYWsZUZakhpBmTX9yST1wude';

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

    // Compare password against hash (timing-safe comparison)
    const isValid = password && bcrypt.compareSync(password, PASSWORD_HASH);

    if (isValid) {
        return res.status(200).json({ success: true });
    } else {
        return res.status(401).json({ error: 'Invalid password' });
    }
};
