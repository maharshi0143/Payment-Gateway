const { sequelize } = require('../config/db');

// GET /health
const getHealth = async (req, res) => {
    let dbStatus = 'disconnected';
    try {
        await sequelize.authenticate();
        dbStatus = 'connected';
    } catch (error) {
        dbStatus = 'disconnected';
    }


    const response = {
        status: 'healthy',
        database: dbStatus,
        timestamp: new Date().toISOString()
    };


    res.status(200).json(response);
};

module.exports = { getHealth };
