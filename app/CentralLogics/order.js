/**
 * Order Logic - Helper functions for Order operations
 */

const Order = require('../../models/Order');
const OrderDetail = require('../../models/OrderDetail');
const Product = require('../../models/Product');
const CartManager = require('./CartManager');
const Helpers = require('./helpers');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');

/**
 * Track order by ID
 * @param {string} order_id - Order ID
 * @returns {Promise<Object>} Order with details and delivery man
 */
const track_order = async (order_id) => {
    return await Order.findById(order_id)
        .populate('details')
        .populate({
            path: 'delivery_man',
            populate: {
                path: 'rating'
            }
        });
};

/**
 * Place a new order
 * @param {string} customer_id - Customer ID
 * @param {string} email - Customer email
 * @param {Object} customer_info - Customer information
 * @param {Array} cart - Cart items
 * @param {string} payment_method - Payment method
 * @param {number} discount - Discount amount
 * @param {string|null} coupon_code - Coupon code
 * @returns {Promise<string>} Order ID
 */
const place_order = async (customer_id, email, customer_info, cart, payment_method, discount, coupon_code = null) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        // Generate unique order ID
        const orderCount = await Order.countDocuments();
        const orderId = 100000 + orderCount + 1;
        
        // Create order
        const order = new Order({
            id: orderId,
            user_id: customer_id,
            order_amount: await CartManager.cart_grand_total(cart) - discount,
            payment_status: 'unpaid',
            order_status: 'pending',
            payment_method: payment_method,
            transaction_ref: null,
            discount_amount: discount,
            coupon_code: coupon_code,
            discount_type: discount == 0 ? null : 'coupon_discount',
            shipping_address: customer_info.address_id
        });
        
        await order.save({ session });
        
        // Create order details for each cart item
        for (const cartItem of cart) {
            const product = await Product.findById(cartItem.id);
            if (!product) continue;
            
            const orderDetail = new OrderDetail({
                order_id: order._id,
                product_id: cartItem.id,
                seller_id: product.added_by === 'seller' ? product.user_id : '0',
                product_details: product,
                qty: cartItem.quantity,
                price: cartItem.price,
                tax: cartItem.tax * cartItem.quantity,
                discount: cartItem.discount * cartItem.quantity,
                discount_type: 'discount_on_product',
                variant: cartItem.variant,
                variation: cartItem.variations,
                delivery_status: 'pending',
                shipping_method_id: cartItem.shipping_method_id,
                payment_status: 'unpaid'
            });
            
            await orderDetail.save({ session });
        }
        
        await session.commitTransaction();
        session.endSession();
        
        // Send order confirmation email
        const emailSettings = await Helpers.get_business_settings('mail_config');
        
        if (emailSettings && emailSettings.status == 1) {
            // Email sending implementation
            // This would be replaced with actual nodemailer implementation
            // For example:
            /*
            const transporter = nodemailer.createTransport({
                service: emailSettings.service,
                auth: {
                    user: emailSettings.email,
                    pass: emailSettings.password
                }
            });
            
            await transporter.sendMail({
                from: emailSettings.email,
                to: email,
                subject: 'Order Placed Successfully',
                html: `<h1>Your order #${orderId} has been placed successfully</h1>`
            });
            */
        }
        
        return order._id;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Error placing order:', error);
        return null;
    }
};

module.exports = {
    track_order,
    place_order
};
