const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Schema = mongoose.Schema;

const userSchema = new Schema(
    {
        name: String,
        f_name: String,
        l_name: String,
        phone: String,
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: true,
        },
        loyalty_point: {
            type: Number,
            default: 0,
        },
        wallet_balance: {
            type: Number,
            default: 0,
        },
        referral_code: String,
        referred_by: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        email_verified_at: Date,
        is_phone_verified: {
            type: Number,
            default: 0,
        },
        remember_token: String,
        created_at: {
            type: Date,
            default: Date.now,
        },
        updated_at: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Static method to get total order amount
userSchema.statics.totalOrderAmount = async function (userId) {
    const Order = mongoose.model("Order");
    const orders = await Order.find({ user_id: userId });
    return orders.reduce((total, order) => total + order.order_amount, 0);
};

// Virtual for orders
userSchema.virtual("orders", {
    ref: "Order",
    localField: "_id",
    foreignField: "user_id",
});

// Virtual for visited products
userSchema.virtual("visited_products", {
    ref: "VisitedProduct",
    localField: "_id",
    foreignField: "user_id",
});

// Virtual for addresses
userSchema.virtual("addresses", {
    ref: "CustomerAddress",
    localField: "_id",
    foreignField: "user_id",
});

// Virtual for favorite products
userSchema.virtual("favorite_products", {
    ref: "FavoriteProduct",
    localField: "_id",
    foreignField: "user_id",
});

// Virtual for search volume
userSchema.virtual("search_volume", {
    ref: "SearchedKeywordUser",
    localField: "_id",
    foreignField: "user_id",
});

// Set toJSON and toObject options
userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

// Hash password before saving
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        return next();
    } catch (error) {
        return next(error);
    }
});

module.exports = mongoose.model("User", userSchema);
