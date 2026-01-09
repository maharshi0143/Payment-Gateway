// 1. VPA Validation
const validateVPA = (vpa) => {
    // Pattern: ^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$
    const vpaRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
    return vpaRegex.test(vpa);
};

// 2. Card Number Validation (Luhn Algorithm)
const validateCardNumber = (cardNumber) => {
    if (!cardNumber) return false;

    // Remove spaces and dashes
    const cleaned = cardNumber.replace(/[\s-]/g, '');

    // Verify only digits and length 13-19
    if (!/^\d{13,19}$/.test(cleaned)) return false;

    let sum = 0;
    let shouldDouble = false;

    // Loop from right to left
    for (let i = cleaned.length - 1; i >= 0; i--) {
        let digit = parseInt(cleaned.charAt(i));

        if (shouldDouble) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }

        sum += digit;
        shouldDouble = !shouldDouble;
    }

    return (sum % 10) === 0;
};

// 3. Card Network Detection
const getCardNetwork = (cardNumber) => {
    if (!cardNumber) return 'unknown';
    const cleaned = cardNumber.replace(/[\s-]/g, '');

    // Visa: Starts with 4
    if (/^4/.test(cleaned)) return 'visa';

    // Mastercard: Starts with 51-55
    if (/^5[1-5]/.test(cleaned)) return 'mastercard';

    // Amex: Starts with 34 or 37
    if (/^3[47]/.test(cleaned)) return 'amex';

    // RuPay: Starts with 60, 65, or 81-89
    if (/^60/.test(cleaned) || /^65/.test(cleaned) || /^8[1-9]/.test(cleaned)) return 'rupay';

    return 'unknown';
};

// 4. Expiry Validation
const validateCardExpiry = (month, year) => {
    if (!month || !year) return false;

    const m = parseInt(month, 10);
    let y = parseInt(year, 10);

    if (isNaN(m) || m < 1 || m > 12) return false;

    // Handle 2-digit year
    if (y < 100) {
        y += 2000;
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-indexed

    if (y < currentYear) return false;
    if (y === currentYear && m < currentMonth) return false;

    return true;
};

module.exports = {
    validateVPA,
    validateCardNumber,
    getCardNetwork,
    validateCardExpiry
};
