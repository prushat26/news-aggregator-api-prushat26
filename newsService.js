const axios = require('axios');
const { User } = require('./userStor');
const NodeCache = require('node-cache');
const newsCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });
const { RateLimiter } = require('limiter');

const limiter = new RateLimiter({
    tokensPerInterval: 1,
    interval: 10000, 
    fireImmediately: false
});

const getPersonalizedNews = async (userId, searchKeyword = null) => {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('USER_NOT_FOUND');

    const prefs = user.preferences 
        ? JSON.parse(user.preferences) 
        : { categories: [], languages: ['en'] };

    const finalQuery = searchKeyword || 
        (prefs.categories && prefs.categories.length > 0 ? prefs.categories.join(' OR ') : 'technology');

    const lang = (prefs.languages && prefs.languages[0]) || 'en';

    const cacheKey = `news_${finalQuery}_${lang}`;
    // Using the exact URL structure confirmed to work in your browser
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(finalQuery)}&mode=ArtList&format=json`;

    const cachedData = newsCache.get(cacheKey);
    if (cachedData) {
        console.log(`[Cache] Returning cached results for: ${cacheKey}`);
        return cachedData;
    }
    
    await limiter.removeTokens(1);
    
    try {
        const response = await axios.get(url, { 
            timeout: 20000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'application/json',
                'Connection': 'keep-alive' 
            }
        });

        // Log the response status and data existence to terminal for debugging
        console.log(`[API] GDELT Status: ${response.status} | Query: ${finalQuery}`);

        if (!response.data || !response.data.articles || !Array.isArray(response.data.articles)) {
            console.log("[API] No articles array found in response data.");
            return [];
        }

        const articles = response.data.articles.map(a => ({
            title: a.title || "Untitled",
            url: a.url,
            source: a.domain || "External",
            publishedAt: a.seendate,
            language: a.language || "Unknown"
        }));

        newsCache.set(cacheKey, articles);
        return articles;

    } catch (err) {
        if (err.response && err.response.status === 429) {
            console.error("GDELT Rate Limit Hit (429). Waiting is required.");
            throw new Error('RATE_LIMIT');
        }
        console.error(`[API Error] ${err.message}`);
        throw err;
    }
};

const startBackgroundSync = () => {
    setInterval(async () => {
        console.log("[Sync] Starting staggered update...");
        try {
            const users = await User.findAll();
            for (const user of users) {
                // The shared cacheKey means if multiple users have the same prefs, 
                // only the first one triggers an actual API call.
                await getPersonalizedNews(user.id).catch(() => null);
            }
            console.log("[Sync] Finished all updates.");
        } catch (err) {
            console.error("[Sync] Background update failed", err);
        }
    }, 3600000); 
};

module.exports = { getPersonalizedNews, startBackgroundSync };