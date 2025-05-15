/**
 * Banner Logic - Helper functions for Banner operations
 */

const Banner = require('../../models/Banner');

/**
 * Get all banners ordered by latest first
 * @returns {Promise<Array>} Array of banner objects
 */
const getBanners = async () => {
    return await Banner.find().sort({ createdAt: -1 });
};

module.exports = {
    getBanners
};
