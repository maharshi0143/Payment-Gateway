const { sequelize } = require('../config/db');
const Merchant = require('./merchant');
const Order = require('./order');
const Payment = require('./payment');

// Define Relationships
Merchant.hasMany(Order, { foreignKey: 'merchant_id' });
Order.belongsTo(Merchant, { foreignKey: 'merchant_id' });

Merchant.hasMany(Payment, { foreignKey: 'merchant_id' });
Payment.belongsTo(Merchant, { foreignKey: 'merchant_id' });

Order.hasMany(Payment, { foreignKey: 'order_id' });
Payment.belongsTo(Order, { foreignKey: 'order_id' });

// Sync database function (Force false to avoid data loss, but can be true for dev)
const syncDatabase = async () => {
    try {
        await sequelize.sync({ alter: true });
        console.log('Database synced successfully');
    } catch (error) {
        console.error('Error syncing database:', error);
    }
};

module.exports = {
    Merchant,
    Order,
    Payment,
    syncDatabase,
    sequelize
};
