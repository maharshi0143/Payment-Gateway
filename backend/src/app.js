const express = require('express');
const cors = require('cors');
const { testConnection, sequelize } = require('./config/db');
const routes = require('./routes');
const { seedTestMerchant } = require('./utils/seeder');
const { syncDatabase } = require('./models');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/', routes);

// Start Server
const PORT = process.env.PORT || 8000;

const startServer = async () => {
    await testConnection();
    await syncDatabase();
    await seedTestMerchant(); // Auto-seed on startup

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
};

if (require.main === module) {
    startServer();
}

module.exports = app;
