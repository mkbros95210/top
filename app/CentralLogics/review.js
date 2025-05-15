/**
 * Review Logic - Helper functions for Review operations
 */

const Review = require('../../models/Review');
const Product = require('../../models/Product');

/**
 * Get reviews for a product
 * @param {string} product_id - Product ID
 * @returns {Promise<Array>} Reviews for the product
 */
const getProductReviews = async (product_id) => {
    return await Review.find({ 
        product_id,
        status: 1 // Active reviews only
    }).populate('user_id', 'name image');
};

/**
 * Get review statistics for a product
 * @param {string} product_id - Product ID
 * @returns {Promise<Object>} Review statistics
 */
const getReviewStats = async (product_id) => {
    const reviews = await Review.find({ product_id, status: 1 });
    
    // Count reviews by rating
    const ratingCount = [0, 0, 0, 0, 0]; // 1-star, 2-star, 3-star, 4-star, 5-star
    let totalRating = 0;
    
    reviews.forEach(review => {
        ratingCount[review.rating - 1]++;
        totalRating += review.rating;
    });
    
    // Calculate average rating
    const averageRating = reviews.length > 0 
        ? parseFloat((totalRating / reviews.length).toFixed(1)) 
        : 0;
    
    return {
        total: reviews.length,
        average: averageRating,
        rating_count: {
            1: ratingCount[0],
            2: ratingCount[1],
            3: ratingCount[2],
            4: ratingCount[3],
            5: ratingCount[4]
        }
    };
};

/**
 * Submit a new review
 * @param {Object} reviewData - Review data
 * @returns {Promise<Object>} New review
 */
const submitReview = async (reviewData) => {
    try {
        // Create new review
        const review = new Review(reviewData);
        await review.save();
        
        // Update product rating
        await updateProductRating(reviewData.product_id);
        
        return review;
    } catch (error) {
        console.error('Error submitting review:', error);
        throw error;
    }
};

/**
 * Update product rating when a new review is added
 * @param {string} product_id - Product ID
 * @returns {Promise<void>}
 */
const updateProductRating = async (product_id) => {
    const stats = await getReviewStats(product_id);
    
    await Product.findByIdAndUpdate(product_id, {
        rating: [
            stats.rating_count[5],
            stats.rating_count[4],
            stats.rating_count[3],
            stats.rating_count[2],
            stats.rating_count[1]
        ]
    });
};

module.exports = {
    getProductReviews,
    getReviewStats,
    submitReview,
    updateProductRating
};
