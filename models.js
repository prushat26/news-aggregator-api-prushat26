const mongoose = require('mongoose');

// --- ARTICLE SCHEMA ---
const ArticleSchema = new mongoose.Schema({
    title: String,
    url: { type: String, unique: true },
    source: String,
    pubDate: Date,
    lang: { type: String, index: true },
    createdAt: { type: Date, default: Date.now, expires: '30d' } 
});

// --- SAVED ARTICLE SCHEMA ---
const SavedArticleSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    article: {
        title: String,
        url: String,
        source: String,
        pubDate: Date
    },
    savedAt: { type: Date, default: Date.now }
});

// --- EDIT: Added UserSchema to support Auth & Preferences logic ---
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true }, // Note: In production, hash this with bcrypt
    preferences: { type: [String], default: [] }
});

// Indices
ArticleSchema.index({ title: 'text', source: 'text' });

// --- STATICS ---

ArticleSchema.statics.fetchFeed = function(query, skip, limit) {
    return Promise.all([
        this.find(query).sort({ pubDate: -1 }).skip(skip).limit(Number(limit)).lean(),
        this.countDocuments(query)
    ]);
};

SavedArticleSchema.statics.upsertSaved = function(userId, art) {
    return this.findOneAndUpdate(
        { userId, "article.url": art.url },
        { 
            userId, 
            article: { 
                title: art.title, 
                url: art.url, 
                source: art.source, 
                pubDate: art.pubDate 
            } 
        },
        { upsert: true, new: true }
    ).lean();
};

// --- EDIT: Added User Statics for Auth and Preference management ---
/**
 * Handles user credential verification
 */
UserSchema.statics.authenticate = async function(email, password) {
    const user = await this.findOne({ email });
    // Using ternary for lean evaluation; returns user or null
    return (user && user.password === password) ? user : null;
};

/**
 * Handles preference retrieval and updates in one place
 */
UserSchema.statics.updatePrefs = function(userId, prefs) {
    return this.findByIdAndUpdate(userId, { preferences: prefs }, { new: true }).lean();
};

const Article = mongoose.model('Article', ArticleSchema);
const SavedArticle = mongoose.model('SavedArticle', SavedArticleSchema);
// --- EDIT: Registering User model ---
const User = mongoose.model('User', UserSchema);

// --- EDIT: Exporting User model ---
module.exports = { Article, SavedArticle, User };