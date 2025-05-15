const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const categorySchema = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        parent_id: {
            type: Schema.Types.ObjectId,
            ref: "Category",
            default: null,
        },
        position: {
            type: Number,
            default: 1,
        },
        status: {
            type: Number,
            default: 1, // 1: Active, 0: Inactive
        },
        image: String,
        banner_image: String,
        translations: [
            {
                locale: String,
                name: String,
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Virtual for parent category
categorySchema.virtual("parent", {
    ref: "Category",
    localField: "parent_id",
    foreignField: "_id",
    justOne: true,
});

// Virtual for child categories
categorySchema.virtual("children", {
    ref: "Category",
    localField: "_id",
    foreignField: "parent_id",
});

// Virtual for products in this category
categorySchema.virtual("products", {
    ref: "Product",
    localField: "_id",
    foreignField: "category_id",
});

// Static method to get active categories
categorySchema.statics.active = function () {
    return this.find({ status: 1 });
};

// Method to get the category hierarchy
categorySchema.methods.getHierarchy = async function () {
    const hierarchy = [this];
    let currentCategory = this;

    while (currentCategory.parent_id) {
        const parent = await this.model("Category").findById(
            currentCategory.parent_id
        );
        if (!parent) break;
        hierarchy.unshift(parent);
        currentCategory = parent;
    }

    return hierarchy;
};

// Set toJSON and toObject options
categorySchema.set("toJSON", { virtuals: true });
categorySchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Category", categorySchema);
