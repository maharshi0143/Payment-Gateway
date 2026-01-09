const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Merchant = sequelize.define('Merchant', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
    },
    api_key: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
    },
    api_secret: {
        type: DataTypes.STRING(64),
        allowNull: false,
    },
    webhook_url: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
}, {
    tableName: 'merchants',
});

module.exports = Merchant;
