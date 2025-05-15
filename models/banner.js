const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bannerSchema = new Schema(
    {
        title: String,
        image: {
            type: String,
            required: true,
        },
        product_id: {
            type: Schema.Types.ObjectId,
            ref: "Product",
        },
        category_id: {
            type: Schema.Types.ObjectId,
            ref: "Category",
        },
        status: {
            type: Number,
            default: 1, // 1: Active, 0: Inactive
        },
        banner_type: {
            type: String,
            enum: ["main_banner", "popup_banner", "footer_banner"],
            default: "main_banner",
        },
        url: String,
        resource_type: {
            type: String,
            enum: ["product", "category", "url"],
            default: "product",
        },
        translations: [
            {
                locale: String,
                title: String,
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Virtual for product
bannerSchema.virtual("product", {
    ref: "Product",
    localField: "product_id",
    foreignField: "_id",
    justOne: true,
});

// Virtual for category
bannerSchema.virtual("category", {
    ref: "Category",
    localField: "category_id",
    foreignField: "_id",
    justOne: true,
});

// Set toJSON and toObject options
bannerSchema.set("toJSON", { virtuals: true });
bannerSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Banner", bannerSchema);
