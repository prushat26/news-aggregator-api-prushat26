require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { connectDB } = require('./database');
const { User } = require('./userStor');
const { authenticateToken } = require('./sessionAuth');
const { getPersonalizedNews, startBackgroundSync } = require('./newsService');
const { validate } = require('./validator');

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'emergency_secret_123';

// --- Utility: Preference Handler ---
const updatePrefs = async (userId, newPrefs, append = false) => {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('USER_NOT_FOUND');

    let finalPrefs = newPrefs;
    if (append) {
        const current = user.preferences ? JSON.parse(user.preferences) : { categories: [], languages: [] };
        finalPrefs = {
            categories: [...new Set([...(current.categories || []), ...(newPrefs.categories || [])])],
            languages: [...new Set([...(current.languages || []), ...(newPrefs.languages || [])])]
        };
    }
    // Optimization: Store as string to match UserStor expectations
    return await User.update({ preferences: JSON.stringify(finalPrefs) }, { where: { id: userId } });
};

// --- Public Routes ---
app.get('/health', (req, res) => res.json({ status: 'online' }));

app.post('/register', validate('register'), async (req, res) => {
    try {
        await User.create(req.body);
        res.status(201).json({ message: 'User identity created' });
    } catch (err) {
        res.status(err.name === 'SequelizeUniqueConstraintError' ? 409 : 400)
           .json({ error: err.name === 'SequelizeUniqueConstraintError' ? 'Email taken' : 'Registration failed' });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (user && await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
        return res.json({ token });
    }
    res.status(401).json({ error: 'Invalid credentials' });
});

// --- Protected Routes ---

app.route('/preferences')
    .all(authenticateToken)
    .get(async (req, res) => {
        const user = await User.findByPk(req.user.id);
        const prefs = user.preferences ? JSON.parse(user.preferences) : { categories: [], languages: [] };
        res.json({ preferences: prefs });
    })
    .post(validate('preferences'), async (req, res) => {
        await updatePrefs(req.user.id, req.body, false);
        res.json({ message: 'Preferences overwritten', preferences: req.body });
    })
    .put(validate('preferences'), async (req, res) => {
        await updatePrefs(req.user.id, req.body, true);
        res.json({ message: 'Preferences updated' });
    });

app.get('/news', authenticateToken, async (req, res) => {
    try {
        const articles = await getPersonalizedNews(req.user.id);
        // Step 4 & 6 Requirement: Handle empty states gracefully
        if (!articles || articles.length === 0) {
            return res.json({ status: "success", message: "No articles found or API rate limited.", data: [] });
        }
        res.json({ status: "success", count: articles.length, data: articles });
    } catch (err) {
        res.status(502).json({ error: "News service temporarily unavailable" });
    }
});

app.get('/news/search/:keyword', authenticateToken, async (req, res) => {
    try {
        const sanitized = req.params.keyword.replace(/[^a-zA-Z0-9\s]/g, '').trim();
        const articles = await getPersonalizedNews(req.user.id, sanitized);
        res.json({ status: "success", keyword: sanitized, data: articles });
    } catch (err) {
        res.status(500).json({ error: "Search failed" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    try {
        await connectDB();
        // Step 6: This is now a "safe" call because we disabled the actual 
        // interval logic inside newsService.js to prevent 429s.
        startBackgroundSync(); 
        console.log(`🚀 Server running at http://localhost:${PORT}`);
    } catch (dbErr) {
        console.error("Failed to connect to database:", dbErr);
    }
});