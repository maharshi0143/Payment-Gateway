const { Merchant } = require('../models');

const seedTestMerchant = async () => {
    const testMerchantData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Merchant',
        email: 'test@example.com',
        api_key: 'key_test_abc123',
        api_secret: 'secret_test_xyz789'
    };

    try {
        const existing = await Merchant.findOne({ where: { email: testMerchantData.email } });
        if (!existing) {
            await Merchant.create(testMerchantData);
            console.log('Test merchant seeded successfully.');
        } else {
            console.log('Test merchant already exists.');
        }
    } catch (error) {
        console.error('Error seeding test merchant:', error);
    }
};

module.exports = { seedTestMerchant };
