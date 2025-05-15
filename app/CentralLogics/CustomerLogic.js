/**
 * Customer Logic - Helper functions for Customer operations
 */

const BusinessSetting = require('../../models/BusinessSetting');
const LoyaltyTransaction = require('../../models/LoyaltyTransaction');
const User = require('../../models/User');
const WalletTransaction = require('../../models/WalletTransaction');
const { v4: uuidv4 } = require('uuid'); // for generating random strings
const mongoose = require('mongoose');

/**
 * Create wallet transaction
 * @param {string} user_id - User ID
 * @param {number} amount - Transaction amount
 * @param {string} transaction_type - Type of transaction
 * @param {string} reference - Reference ID or description
 * @returns {Promise<boolean|Object>} - Transaction result
 */
const create_wallet_transaction = async (user_id, amount, transaction_type, reference) => {
    // Check if wallet is enabled
    const walletStatus = await BusinessSetting.findOne({ key: 'wallet_status' });
    if (!walletStatus || walletStatus.value != 1) return false;

    const user = await User.findById(user_id);
    if (!user) return false;
    
    const current_balance = user.wallet_balance || 0;

    const wallet_transaction = new WalletTransaction({
        user_id: user.id,
        transaction_id: uuidv4(),
        reference: reference,
        transaction_type: transaction_type
    });

    let debit = 0.0;
    let credit = 0.0;

    if (['add_fund_by_admin', 'add_fund', 'loyalty_point', 'referrer'].includes(transaction_type)) {
        credit = amount;

        if (transaction_type === 'loyalty_point') {
            const loyaltyExchangeRate = await BusinessSetting.findOne({ key: 'loyalty_point_exchange_rate' });
            credit = Math.floor(amount / (loyaltyExchangeRate ? loyaltyExchangeRate.value : 1));
        }
    } else if (transaction_type === 'order_place') {
        debit = amount;
    }

    wallet_transaction.credit = credit;
    wallet_transaction.debit = debit;
    wallet_transaction.balance = current_balance + credit - debit;
    
    // Update user's wallet balance
    user.wallet_balance = current_balance + credit - debit;

    try {
        const session = await mongoose.startSession();
        session.startTransaction();
        
        await user.save({ session });
        await wallet_transaction.save({ session });
        
        await session.commitTransaction();
        session.endSession();
        
        if (['loyalty_point', 'order_place', 'add_fund_by_admin', 'referrer'].includes(transaction_type)) {
            return wallet_transaction;
        }
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
};

/**
 * Create loyalty point transaction
 * @param {string} user_id - User ID
 * @param {string} reference - Reference ID or description
 * @param {number} amount - Transaction amount
 * @param {string} transaction_type - Type of transaction
 * @returns {Promise<boolean>} - Transaction result
 */
const create_loyalty_point_transaction = async (user_id, reference, amount, transaction_type) => {
    // Get loyalty settings
    const loyaltySettings = await BusinessSetting.find({
        key: { $in: ['loyalty_point_status', 'loyalty_point_exchange_rate', 'loyalty_point_percent_on_item_purchase'] }
    });
    
    const settings = loyaltySettings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
    }, {});
    
    if (settings.loyalty_point_status != 1) {
        return true;
    }

    let credit = 0;
    let debit = 0;
    const user = await User.findById(user_id);
    if (!user) return false;

    const loyalty_point_transaction = new LoyaltyTransaction({
        user_id: user.id,
        transaction_id: uuidv4(),
        reference: reference,
        transaction_type: transaction_type
    });

    if (transaction_type === 'order_place') {
        credit = Math.floor(amount * settings.loyalty_point_percent_on_item_purchase / 100);
    } else if (transaction_type === 'point_to_wallet') {
        debit = amount;
    }

    const current_balance = (user.loyalty_point || 0) + credit - debit;
    loyalty_point_transaction.balance = current_balance;
    loyalty_point_transaction.credit = credit;
    loyalty_point_transaction.debit = debit;
    
    user.loyalty_point = current_balance;

    try {
        const session = await mongoose.startSession();
        session.startTransaction();
        
        await user.save({ session });
        await loyalty_point_transaction.save({ session });
        
        await session.commitTransaction();
        session.endSession();
        
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
};

/**
 * Create referral earning wallet transaction
 * @param {string} user_id - User ID (referrer)
 * @param {string} transaction_type - Type of transaction
 * @param {string} reference - User ID being referred
 * @returns {Promise<boolean>} - Transaction result
 */
const referral_earning_wallet_transaction = async (user_id, transaction_type, reference) => {
    const user = await User.findById(reference);
    if (!user) return false;
    
    const current_balance = user.wallet_balance || 0;

    let debit = 0.0;
    let credit = 0.0;
    
    // Get referral earning rate
    const refEarningRate = await BusinessSetting.findOne({ key: 'ref_earning_exchange_rate' });
    const amount = refEarningRate ? refEarningRate.value : 0;
    credit = amount;

    const wallet_transaction = new WalletTransaction({
        user_id: user.id,
        transaction_id: uuidv4(),
        reference: user_id,
        transaction_type: transaction_type,
        credit: credit,
        debit: debit,
        balance: current_balance + credit
    });
    
    user.wallet_balance = current_balance + credit;

    try {
        const session = await mongoose.startSession();
        session.startTransaction();
        
        await user.save({ session });
        await wallet_transaction.save({ session });
        
        await session.commitTransaction();
        session.endSession();
        
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
};

/**
 * Transfer loyalty points to wallet
 * @param {string} user_id - User ID
 * @param {number} point - Loyalty points to transfer
 * @param {number} amount - Wallet amount to credit
 * @returns {Promise<boolean>} - Transaction result
 */
const loyalty_point_wallet_transfer_transaction = async (user_id, point, amount) => {
    try {
        const session = await mongoose.startSession();
        session.startTransaction();
        
        // Get user
        const user = await User.findById(user_id).session(session);
        if (!user) {
            await session.abortTransaction();
            session.endSession();
            return false;
        }
        
        const current_wallet_balance = user.wallet_balance || 0;
        const current_point = user.loyalty_point || 0;
        
        // Update user
        user.loyalty_point = current_point - point;
        user.wallet_balance = current_wallet_balance + amount;
        await user.save({ session });
        
        // Create wallet transaction
        await WalletTransaction.create([{
            user_id: user_id,
            transaction_id: uuidv4(),
            reference: null,
            transaction_type: 'loyalty_point_to_wallet',
            debit: 0,
            credit: amount,
            balance: current_wallet_balance + amount
        }], { session });
        
        // Create loyalty transaction
        await LoyaltyTransaction.create([{
            user_id: user_id,
            transaction_id: uuidv4(),
            reference: null,
            transaction_type: 'loyalty_point_to_wallet',
            debit: point,
            credit: 0,
            balance: current_point - point
        }], { session });
        
        await session.commitTransaction();
        session.endSession();
        
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
};

module.exports = {
    create_wallet_transaction,
    create_loyalty_point_transaction,
    referral_earning_wallet_transaction,
    loyalty_point_wallet_transfer_transaction
};
