/**
 * Coupon Logic - Helper functions for Coupon operations
 */

const Coupon = require('../../models/Coupon');
const Order = require('../../models/Order');

/**
 * Apply coupon to order
 * @param {string} coupon_code - Coupon code
 * @param {number} order_amount - Order amount
 * @param {string} customer_id - Customer ID
 * @param {number} delivery_charge - Delivery charge
 * @returns {number} Discount amount
 */
const coupon_apply = async (coupon_code, order_amount, customer_id, delivery_charge) => {
    // Find active coupon with matching code
    const coupon = await Coupon.findOne({ 
        code: coupon_code,
        status: 1 // active
    });

    if (!coupon) {
        return 0;
    }

    // Get count of orders from this customer with this coupon
    const total = await Order.countDocuments({ 
        user_id: customer_id, 
        coupon_code: coupon_code 
    });

    // Default coupon type
    if (coupon.coupon_type === 'default') {
        if (total > coupon.limit || coupon.min_purchase > order_amount) {
            return 0;
        }

        let coupon_discount = 0;
        if (coupon.discount_type === 'percent') {
            coupon_discount = (order_amount / 100) * coupon.discount;
            if (coupon.max_discount < coupon_discount) {
                coupon_discount = coupon.max_discount;
            }
        } else {
            coupon_discount = coupon.discount;
        }
        return coupon_discount;
    }

    // First order coupon type
    if (coupon.coupon_type === 'first_order') {
        if (total !== 0 || coupon.min_purchase > order_amount) {
            return 0;
        }

        let coupon_discount = 0;
        if (coupon.discount_type === 'percent') {
            coupon_discount = (order_amount / 100) * coupon.discount;
            if (coupon.max_discount < coupon_discount) {
                coupon_discount = coupon.max_discount;
            }
        } else {
            coupon_discount = coupon.discount;
        }
        return coupon_discount;
    }

    // Free delivery
    if (coupon.coupon_type === 'free_delivery') {
        if (total > coupon.limit || coupon.min_purchase > order_amount) {
            return 0;
        }

        return delivery_charge;
    }

    // Customer wise
    if (coupon.coupon_type === 'customer_wise') {
        if (total > coupon.limit || coupon.min_purchase > order_amount) {
            return 0;
        }

        if (coupon.customer_id !== customer_id) {
            return 0;
        }

        let coupon_discount = 0;
        if (coupon.discount_type === 'percent') {
            coupon_discount = (order_amount / 100) * coupon.discount;
            if (coupon.max_discount < coupon_discount) {
                coupon_discount = coupon.max_discount;
            }
        } else {
            coupon_discount = coupon.discount;
        }
        return coupon_discount;
    }

    return 0;
};

module.exports = {
    coupon_apply
};
