const { Merchant } = require('../models');

const authenticateMerchant = async (req, res, next) => {
    // Check for Public Endpoints (Test mode or specific public paths if any)
    // The requirement says "Every API endpoint except /health must validate..."
    // BUT we also have public checkout endpoints. We should handle those slightly differently or separate route groups.
    // For now, this middleware is for PROTECTED routes.

    const apiKey = req.header('X-Api-Key');
    const apiSecret = req.header('X-Api-Secret');

    if (!apiKey || !apiSecret) {
        return res.status(401).json({
            error: {
                code: 'AUTHENTICATION_ERROR',
                description: 'Invalid API credentials'
            }
        });
    }

    try {
        const merchant = await Merchant.findOne({
            where: {
                api_key: apiKey,
                api_secret: apiSecret,
                is_active: true
            }
        });

        if (!merchant) {
            return res.status(401).json({
                error: {
                    code: 'AUTHENTICATION_ERROR',
                    description: 'Invalid API credentials'
                }
            });
        }

        req.merchant = merchant;
        next();
    } catch (error) {
        console.error('Auth Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = { authenticateMerchant };
