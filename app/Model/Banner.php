const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bannerSchema = new Schema({
    product_id: {
        type: Schema.Types.ObjectId,
        ref: 'Product'
    },
    category_id: {
        type: Schema.Types.ObjectId,
        ref: 'Category'
    },
    title: String,
    image: String,
    status: {
        type: Number,
        default: 1
    },
    banner_type: {
        type: String,
        enum: ['main_banner', 'popup_banner', 'footer_banner'],
        default: 'main_banner'
    },
    url: String,
    resource_type: {
        type: String,
        enum: ['product', 'category', 'url'],
        default: 'product'
    },
    translations: [{
        locale: String,
        title: String
    }]
}, {
    timestamps: true
});

// Method equivalent to scopeActive in Laravel
bannerSchema.statics.active = function() {
    return this.find({ status: 1 });
};

// Virtual for product (equivalent to the belongsTo relationship)
bannerSchema.virtual('product', {
    ref: 'Product',
    localField: 'product_id',
    foreignField: '_id',
    justOne: true
});

// Virtual for category (equivalent to the belongsTo relationship)
bannerSchema.virtual('category', {
    ref: 'Category',
    localField: 'category_id',
    foreignField: '_id',
    justOne: true
});

// Set toJSON and toObject options to include virtuals
bannerSchema.set('toJSON', { virtuals: true });
bannerSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Banner', bannerSchema);