const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const WebhookLog = sequelize.define('WebhookLog', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    merchant_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    event: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    payload: {
        type: DataTypes.JSON,
        allowNull: false,
    },
    status: {
        type: DataTypes.STRING(20),
        defaultValue: 'pending', // 'pending', 'success', 'failed'
    },
    attempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    last_attempt_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    next_retry_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    response_code: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    response_body: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
}, {
    tableName: 'webhook_logs',
    indexes: [
        {
            fields: ['merchant_id'],
        },
        {
            fields: ['status'],
        },
        {
            fields: ['next_retry_at'],
            where: {
                status: 'pending'
            }
        }
    ],
});

module.exports = WebhookLog;
