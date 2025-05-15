/**
 * Category Logic - Helper functions for Category operations
 */

const Category = require('../../models/Category');
const Product = require('../../models/Product');

/**
 * Get all parent categories (position 0)
 * @returns {Promise<Array>} Array of parent category objects
 */
const parents = async () => {
    return await Category.find({ position: 0 });
};

/**
 * Get child categories of a parent
 * @param {string} parent_id - Parent category ID
 * @returns {Promise<Array>} Array of child category objects
 */
const child = async (parent_id) => {
    return await Category.find({ parent_id });
};

/**
 * Get products by category ID
 * @param {string} category_id - Category ID
 * @returns {Promise<Array>} Array of product objects
 */
const products = async (category_id) => {
    // Find products where category_ids array contains the category_id
    const products = await Product.find({ 
        'category_ids.id': category_id,
        status: 1 // active only
    })
    .populate('rating')
    .populate('active_reviews');
    
    return products;
};

/**
 * Get all products from a category and its subcategories
 * @param {string} id - Category ID
 * @returns {Promise<Array>} Array of product objects
 */
const all_products = async (id) => {
    // Collect all category IDs (current + children + grandchildren)
    const cate_ids = [id];
    
    // Get first level children
    const children = await child(id);
    for (const ch1 of children) {
        cate_ids.push(ch1._id.toString());
        
        // Get second level children (grandchildren)
        const grandchildren = await child(ch1._id);
        for (const ch2 of grandchildren) {
            cate_ids.push(ch2._id.toString());
        }
    }
    
    // Get products from all collected categories
    const products = await Product.find({
        'category_ids.id': { $in: cate_ids },
        status: 1 // active only
    })
    .populate('rating')
    .populate('active_reviews')
    .populate('wishlist');
    
    return products;
};

module.exports = {
    parents,
    child,
    products,
    all_products
};
