const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Order = sequelize.define('Order', {
    id: {
        type: DataTypes.STRING(64),
        primaryKey: true,
        // Custom generation logic will be in the service/controller
    },
    merchant_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 100,
        },
    },
    currency: {
        type: DataTypes.STRING(3),
        defaultValue: 'INR',
    },
    receipt: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    notes: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    status: {
        type: DataTypes.STRING(20),
        defaultValue: 'created',
    },
}, {
    tableName: 'orders',
    indexes: [
        {
            fields: ['merchant_id'],
        },
    ],
});

module.exports = Order;
