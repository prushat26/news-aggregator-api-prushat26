const axios = require('axios');
const { User } = require('./userStor');
const NodeCache = require('node-cache');

// 1. Long-Term Cache: 4 hours. 
// We only hit the API once every 4 hours for the same query.
const newsCache = new NodeCache({ stdTTL: 14400 }); 

const getPersonalizedNews = async (userId, searchKeyword = null) => {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('USER_NOT_FOUND');

    const prefs = user.preferences ? JSON.parse(user.preferences) : { categories: ['technology'] };
    const query = searchKeyword || (prefs.categories?.[0] || 'news');

    // 2. The Cache-First Wall
    const cacheKey = `simple_news_${query.toLowerCase()}`;
    const existing = newsCache.get(cacheKey);
    if (existing) return existing;

    // 3. Ultra-Simple URL: No complex OR logic, no extra modes.
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=ArtList&format=json`;

    try {
        // 4. Naked Request: Sometimes complex headers actually trigger modern firewalls
        // because they look "too perfect." We use just the bare essentials here.
        const response = await axios.get(url, { timeout: 10000 });

        const articles = (response.data?.articles || []).map(a => ({
            title: a.title || "News Story",
            url: a.url,
            source: a.domain || "GDELT",
            publishedAt: a.seendate
        }));

        if (articles.length > 0) {
            newsCache.set(cacheKey, articles);
        }
        return articles;

    } catch (err) {
        // Silent failure: return empty array so the app doesn't crash
        console.error("GDELT limit reached. Serving empty state.");
        return [];
    }
};

// 5. REMOVE Periodic Cache Updates
// Background syncs are the #1 reason for 429s. 
// We disable it entirely to ensure requests only happen when a human clicks.
const startBackgroundSync = () => {
    console.log("Background sync disabled for API stability.");
};

module.exports = { getPersonalizedNews, startBackgroundSync };