const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Schema = mongoose.Schema;

const adminSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
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
        phone: String,
        image: String,
        role_id: {
            type: Schema.Types.ObjectId,
            ref: "AdminRole",
        },
        status: {
            type: Number,
            default: 1, // 1: Active, 0: Inactive
        },
        remember_token: String,
    },
    {
        timestamps: true,
    }
);

// Method to compare password
adminSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Hash password before saving
adminSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        return next();
    } catch (error) {
        return next(error);
    }
});

// Relationship with AdminRole
adminSchema.virtual("role", {
    ref: "AdminRole",
    localField: "role_id",
    foreignField: "_id",
    justOne: true,
});

// Set toJSON and toObject options
adminSchema.set("toJSON", { virtuals: true });
adminSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Admin", adminSchema);
