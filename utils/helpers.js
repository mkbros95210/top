/**
 * Helper functions
 */

/**
 * Format currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 * @returns {string} - Formatted currency
 */
exports.formatCurrency = (amount, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
    }).format(amount);
};

/**
 * Generate random string
 * @param {number} length - Length of string
 * @returns {string} - Random string
 */
exports.generateRandomString = (length = 8) => {
    const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";

    for (let i = 0; i < length; i++) {
        result += characters.charAt(
            Math.floor(Math.random() * characters.length)
        );
    }

    return result;
};

/**
 * Generate referral code
 * @returns {string} - Referral code
 */
exports.generateReferralCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
};

/**
 * Get current date in YYYY-MM-DD format
 * @returns {string} - Date string
 */
exports.getCurrentDate = () => {
    const date = new Date();
    return date.toISOString().split("T")[0];
};

/**
 * Calculate discount
 * @param {number} price - Original price
 * @param {number} discount - Discount amount
 * @param {string} discountType - Discount type (percent or amount)
 * @returns {number} - Discounted price
 */
exports.calculateDiscount = (price, discount, discountType = "percent") => {
    if (!discount || discount <= 0) return price;

    if (discountType === "percent") {
        return price - price * (discount / 100);
    }

    return price - discount;
};
