/**
 * Notification Logic - Helper functions for Notification operations
 */

const Notification = require('../../models/Notification');
const User = require('../../models/User');
const DeliveryMan = require('../../models/DeliveryMan');

/**
 * Send notification to customers
 * @param {string} title - Notification title
 * @param {string} description - Notification description
 * @param {string|null} image - Image URL
 * @param {string} type - Notification type
 * @returns {Promise<boolean>} Success status
 */
const sendNotificationToCustomers = async (title, description, image = null, type = 'general') => {
    try {
        // Create notification
        const notification = new Notification({
            title,
            description,
            image,
            type,
            status: 1
        });
        
        await notification.save();
        
        // Here you would also handle sending push notifications to mobile devices
        // This would typically involve using Firebase FCM or another notification service
        
        return true;
    } catch (error) {
        console.error('Error sending notification:', error);
        return false;
    }
};

/**
 * Send notification to a specific customer
 * @param {string} customer_id - Customer ID
 * @param {string} title - Notification title
 * @param {string} description - Notification description
 * @param {string|null} image - Image URL
 * @param {string} type - Notification type
 * @returns {Promise<boolean>} Success status
 */
const sendNotificationToCustomer = async (customer_id, title, description, image = null, type = 'specific') => {
    try {
        // Find customer
        const customer = await User.findById(customer_id);
        if (!customer) return false;
        
        // Create notification
        const notification = new Notification({
            title,
            description,
            image,
            type,
            status: 1,
            user_id: customer_id
        });
        
        await notification.save();
        
        // Send push notification if FCM token exists
        // This is a placeholder for your actual push notification implementation
        
        return true;
    } catch (error) {
        console.error('Error sending notification to customer:', error);
        return false;
    }
};

/**
 * Send notification to delivery person
 * @param {string} delivery_man_id - Delivery man ID
 * @param {string} title - Notification title
 * @param {string} description - Notification description
 * @param {string|null} image - Image URL
 * @param {string} type - Notification type
 * @returns {Promise<boolean>} Success status
 */
const sendNotificationToDeliveryMan = async (delivery_man_id, title, description, image = null, type = 'order') => {
    try {
        // Find delivery man
        const deliveryMan = await DeliveryMan.findById(delivery_man_id);
        if (!deliveryMan) return false;
        
        // Create notification
        const notification = new Notification({
            title,
            description,
            image,
            type,
            status: 1,
            delivery_man_id
        });
        
        await notification.save();
        
        // Send push notification if FCM token exists
        // This is a placeholder for your actual push notification implementation
        
        return true;
    } catch (error) {
        console.error('Error sending notification to delivery man:', error);
        return false;
    }
};

module.exports = {
    sendNotificationToCustomers,
    sendNotificationToCustomer,
    sendNotificationToDeliveryMan
};
