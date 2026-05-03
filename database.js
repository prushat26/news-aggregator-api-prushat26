const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        const options = {
            maxPoolSize: 10,        // Allows multiple parallel fetches from syncNews
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };

        await mongoose.connect(process.env.MONGO_URI, options);
        console.log(`[${new Date().toISOString()}] DB Connected`);

        // Handle connection interruptions (Operational Resilience)
        mongoose.connection.on('error', err => console.error('Database Error:', err));
        mongoose.connection.on('disconnected', () => console.warn('Database Disconnected. Reconnecting...'));

    } catch (err) {
        console.error('Critical Database Failure:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;