const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Refund = sequelize.define('Refund', {
    id: {
        type: DataTypes.STRING(64),
        primaryKey: true,
    },
    payment_id: {
        type: DataTypes.STRING(64),
        allowNull: false,
    },
    merchant_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    reason: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    status: {
        type: DataTypes.STRING(20),
        defaultValue: 'pending', // 'pending', 'processed'
    },
    processed_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    tableName: 'refunds',
    indexes: [
        {
            fields: ['payment_id'],
        },
    ],
});

module.exports = Refund;
