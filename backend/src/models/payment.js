const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Payment = sequelize.define('Payment', {
    id: {
        type: DataTypes.STRING(64),
        primaryKey: true,
    },
    order_id: {
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
    currency: {
        type: DataTypes.STRING(3),
        defaultValue: 'INR',
    },
    method: {
        type: DataTypes.STRING(20),
        allowNull: false, // "upi" or "card"
    },
    status: {
        type: DataTypes.STRING(20),
        defaultValue: 'pending', // "pending", "success", "failed"
    },
    captured: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    vpa: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    card_network: {
        type: DataTypes.STRING(20),
        allowNull: true, // "visa", "mastercard", etc.
    },
    card_last4: {
        type: DataTypes.STRING(4),
        allowNull: true,
    },
    error_code: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    error_description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
}, {
    tableName: 'payments',
    indexes: [
        {
            fields: ['order_id'],
        },
        {
            fields: ['status'],
        },
    ],
});

module.exports = Payment;
