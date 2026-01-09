const { Merchant } = require('../models');

// GET /api/v1/test/merchant
const getTestMerchant = async (req, res) => {
    try {
        const merchant = await Merchant.findOne({
            where: { email: 'test@example.com' }
        });

        if (!merchant) {
            return res.status(404).json({ error: 'Test merchant not found' });
        }

        res.json({
            id: merchant.id,
            email: merchant.email,
            api_key: merchant.api_key,
            seeded: true
        });
    } catch (error) {
        console.error('Test controller error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = { getTestMerchant };
