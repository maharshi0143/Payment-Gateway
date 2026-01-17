const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const IdempotencyKey = sequelize.define('IdempotencyKey', {
    key: {
        type: DataTypes.STRING(255),
        primaryKey: true,
    },
    merchant_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    response: {
        type: DataTypes.JSON,
        allowNull: false,
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
    },
}, {
    tableName: 'idempotency_keys',
});

module.exports = IdempotencyKey;
