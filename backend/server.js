const express = require('express');
const cors = require('cors');

const { connectDatabase } = require('./config/database');
const env = require('./config/env');
const authRoutes = require('./routes/authRoutes');
const gameRoutes = require('./routes/gameRoutes');
const userRoutes = require('./routes/userRoutes');

function createApp() {
    const app = express();
    app.use(cors());
    app.use(express.json());
    app.use(authRoutes);
    app.use(gameRoutes);
    app.use(userRoutes);
    return app;
}

async function startServer() {
    try {
        await connectDatabase(env.mongoUri);
        const app = createApp();
        app.listen(env.port, () => {
            console.log(`Server running on port ${env.port}`);
        });
    } catch (err) {
        console.error('MongoDB connection error:', err);
    }
}

if (require.main === module) {
    startServer();
}

module.exports = {
    createApp,
    startServer
};
