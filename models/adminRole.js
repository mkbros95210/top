const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const adminRoleSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
        },
        modules: [
            {
                type: String,
            },
        ],
        status: {
            type: Number,
            default: 1, // 1: Active, 0: Inactive
        },
    },
    {
        timestamps: true,
    }
);

// Virtual for admins with this role
adminRoleSchema.virtual("admins", {
    ref: "Admin",
    localField: "_id",
    foreignField: "role_id",
});

// Set toJSON and toObject options
adminRoleSchema.set("toJSON", { virtuals: true });
adminRoleSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("AdminRole", adminRoleSchema);
