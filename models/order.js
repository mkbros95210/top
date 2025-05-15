const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderSchema = new Schema(
    {
        user_id: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        order_amount: {
            type: Number,
            required: true,
        },
        coupon_discount_amount: {
            type: Number,
            default: 0,
        },
        coupon_discount_title: String,
        payment_status: {
            type: String,
            enum: ["paid", "unpaid"],
            default: "unpaid",
        },
        order_status: {
            type: String,
            enum: [
                "pending",
                "confirmed",
                "processing",
                "out_for_delivery",
                "delivered",
                "canceled",
            ],
            default: "pending",
        },
        total_tax_amount: {
            type: Number,
            default: 0,
        },
        payment_method: {
            type: String,
            enum: ["cash_on_delivery", "digital_payment", "wallet"],
            default: "cash_on_delivery",
        },
        transaction_reference: String,
        delivery_address_id: {
            type: Schema.Types.ObjectId,
            ref: "CustomerAddress",
        },
        delivery_charge: {
            type: Number,
            default: 0,
        },
        delivery_address: Object,
        delivery_man_id: {
            type: Schema.Types.ObjectId,
            ref: "DeliveryMan",
        },
        expected_delivery_date: Date,
        order_note: String,
        checked: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Virtual for order details
orderSchema.virtual("details", {
    ref: "OrderDetail",
    localField: "_id",
    foreignField: "order_id",
});

// Virtual for delivery history
orderSchema.virtual("delivery_history", {
    ref: "OrderDeliveryHistory",
    localField: "_id",
    foreignField: "order_id",
});

// Virtual for order logs
orderSchema.virtual("tracking", {
    ref: "DeliveryHistory",
    localField: "_id",
    foreignField: "order_id",
});

// Set toJSON and toObject options
orderSchema.set("toJSON", { virtuals: true });
orderSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Order", orderSchema);
