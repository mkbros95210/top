const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productSchema = new Schema(
    {
        name: String,
        description: String,
        image: String,
        images: [String],
        category_id: {
            type: Schema.Types.ObjectId,
            ref: "Category",
        },
        tax: {
            type: Number,
            default: 0,
        },
        price: {
            type: Number,
            required: true,
        },
        capacity: Number,
        unit: String,
        discount: {
            type: Number,
            default: 0,
        },
        discount_type: {
            type: String,
            enum: ["percent", "amount"],
            default: "percent",
        },
        total_stock: {
            type: Number,
            default: 0,
        },
        status: {
            type: Number,
            default: 1, // 1: Active, 0: Inactive
        },
        set_menu: {
            type: Number,
            default: 0, // 0: No, 1: Yes
        },
        is_featured: {
            type: Number,
            default: 0, // 0: No, 1: Yes
        },
        translations: [
            {
                locale: String,
                name: String,
                description: String,
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Static method to get active products
productSchema.statics.active = function () {
    return this.find({ status: 1 });
};

// Virtual for reviews
productSchema.virtual("reviews", {
    ref: "Review",
    localField: "_id",
    foreignField: "product_id",
    options: { sort: { createdAt: -1 } },
});

// Virtual for active reviews
productSchema.virtual("active_reviews", {
    ref: "Review",
    localField: "_id",
    foreignField: "product_id",
    match: { is_active: 1 },
    options: { sort: { createdAt: -1 } },
});

// Virtual for wishlist
productSchema.virtual("wishlist", {
    ref: "Wishlist",
    localField: "_id",
    foreignField: "product_id",
    options: { sort: { createdAt: -1 } },
});

// Virtual for order details
productSchema.virtual("order_details", {
    ref: "OrderDetail",
    localField: "_id",
    foreignField: "product_id",
});

// Method to get rating
productSchema.methods.getRating = async function () {
    const Review = mongoose.model("Review");
    const reviews = await Review.find({
        product_id: this._id,
        is_active: 1,
    });

    if (reviews.length === 0) return 0;

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    return totalRating / reviews.length;
};

// Method to get all ratings (including inactive)
productSchema.methods.getAllRating = async function () {
    const Review = mongoose.model("Review");
    const reviews = await Review.find({ product_id: this._id });

    if (reviews.length === 0) return 0;

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    return totalRating / reviews.length;
};

// Set up tags relationship (many-to-many)
productSchema.virtual("tags", {
    ref: "Tag",
    localField: "_id",
    foreignField: "products",
});

// Set toJSON and toObject options
productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

// Add a middleware to get translations for current locale
productSchema.pre("find", function (next) {
    this.populate("translations");
    next();
});

module.exports = mongoose.model("Product", productSchema);
