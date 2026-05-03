// config.js - Application Constants & Logic Mapping
module.exports = {
    // Hidden language map
    L_MAP: {
        en: 'english', es: 'spanish', zh: 'chinese', ar: 'arabic',
        pt: 'portuguese', ja: 'japanese', ru: 'russian', fr: 'french',
        de: 'german', hi: 'hindi', no: 'norwegian', sv: 'swedish',
        da: 'danish', fi: 'finnish'
    },

    // Sync Settings
    MAX_REC: 100,
    SYNC_WINDOW: '90min',
    THEMES: "(THEME:TAX_TECHNOLOGY OR THEME:ECON_ENTREPRENEURSHIP)",

    // UPDATE: Operations moved from routes logic to config settings
    DEFAULT_LANG: 'en',
    
    // O(1) logic for building the MongoDB query object
    getSearchQuery: (lang, q, source) => {
        const query = { lang: module.exports.L_MAP[lang] ? lang : module.exports.DEFAULT_LANG };
        
        // Ternaries for high-density logic assignment
        source ? query.source = { $regex: source, $options: 'i' } : null;
        q ? query.$text = { $search: q } : null;
        
        return query;
    }
};