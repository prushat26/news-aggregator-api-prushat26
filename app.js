const express = require('express');
// --- EDIT: Imported new service functions ---
const { 
    getFeed, saveArticle, getUserSaved, deleteSaved, 
    signup, login, getPrefs, updatePrefs 
} = require('./newsService');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Response Wrapper
const handle = (res, fn) => fn
    .then(r => res.json({ status: 'success', ...r }))
    // --- EDIT: Enhanced error mapping for 404 and 401 status codes ---
    .catch(e => {
        const code = e.message === '404' ? 404 : e.message === '401' ? 401 : 500;
        res.status(code).json({ status: 'error', msg: e.message });
    });

// 1. Auth Endpoints (Required by server.test.js)
app.post('/users/signup', (req, res) => handle(res, signup(req.body)));

app.post('/users/login', (req, res) => handle(res, login(req.body)));

// 2. Preference Endpoints (Required by server.test.js)
app.get('/users/preferences', (req, res) => {
    const auth = req.headers.authorization;
    // Ternary guard for token presence
    return !auth ? res.status(401).json({ status: 'error', msg: '401' }) : handle(res, getPrefs(req.query.userId));
});

app.put('/users/preferences', (req, res) => handle(res, updatePrefs(req.body.userId, req.body.preferences)));

// 3. News & Save Endpoints
app.get('/api/news', (req, res) => handle(res, getFeed(req.query)));

app.post('/api/save', (req, res) => {
    const { userId, url } = req.body;
    return !userId || !url ? res.status(400).json({ msg: 'Missing Params' }) : handle(res, saveArticle(userId, url));
});

app.get('/api/saved/:userId', (req, res) => handle(res, getUserSaved(req.params.userId, req.query.q)));

app.delete('/api/saved/:id', (req, res) => handle(res, deleteSaved(req.params.id)));

module.exports = app;