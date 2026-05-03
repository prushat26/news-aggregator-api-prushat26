require('dotenv').config();
const app = require('./app');
const connectDB = require('./database');
const { syncNews } = require('./newsService');

const PORT = process.env.PORT || 3000;
const SYNC_INTERVAL = 5400000; // 90 minutes

// 1. Database & Server Orchestration
// Using an async wrapper ensures the DB is ready before the app accepts traffic
const start = async () => {
    try {
        await connectDB();
        
        const server = app.listen(PORT, (err) => {
            err ? console.error('Startup Error:', err) : console.log(`[${new Date().toISOString()}] Listening on ${PORT}`);

            // 2. Background Task Lifecycle
            syncNews();
            const task = setInterval(syncNews, SYNC_INTERVAL);

            // 3. Graceful Shutdown
            const shutdown = async () => {
                console.log('Stopping server...');
                clearInterval(task);
                server.close(() => {
                    console.log('Server closed.');
                    process.exit(0);
                });
            };

            process.on('SIGTERM', shutdown);
            process.on('SIGINT', shutdown);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
};

start();