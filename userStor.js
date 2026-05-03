const { DataTypes } = require('sequelize');
const { sequelize } = require('./database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
    email: { 
        type: DataTypes.STRING, 
        unique: true, 
        allowNull: false,
        validate: { isEmail: true }
    },
    password: { 
        type: DataTypes.STRING, 
        allowNull: false 
    },
    // Store preferences as a stringified JSON array/object
    preferences: {
        type: DataTypes.TEXT,
        defaultValue: JSON.stringify({ categories: [], languages: ['en'] })
    }
}, {
    hooks: {
        beforeCreate: async (user) => {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
        }
    }
});

const Article = sequelize.define('Article', {
    title: DataTypes.STRING,
    url: { type: DataTypes.STRING, unique: true },
    source: DataTypes.STRING,
    category: DataTypes.STRING,
    lang: DataTypes.STRING
});

const ReadArticle = sequelize.define('ReadArticle', {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    articleUrl: { type: DataTypes.STRING, allowNull: false }
});

const Bookmark = sequelize.define('Bookmark', {
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    url: {
        type: DataTypes.STRING,
        allowNull: false
    },
    source: DataTypes.STRING,
    publishedAt: DataTypes.STRING
});

module.exports = { User, Article, Bookmark, ReadArticle };