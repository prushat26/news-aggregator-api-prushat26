const { Sequelize } = require('sequelize');
require('dotenv').config();

// Initialize the local SQLite instance
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './news.sqlite', // The database is now a single file in project root
    logging: false
});

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        // Sync ensures tables exist without manual SQL commands
        await sequelize.sync({ alter: true }); 
        console.log(`[${new Date().toISOString()}] SQLite Connected: news.sqlite`);
    } catch (err) {
        console.error('Critical Database Failure:', err.message);
        process.exit(1);
    }
};

// Export both the connection function and the instance for models
module.exports = { connectDB, sequelize };