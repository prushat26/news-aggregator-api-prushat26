const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'emergency_secret_123';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
        req.user = user; // Adds { id, email } to the request object
        next();
    });
};

module.exports = { authenticateToken };