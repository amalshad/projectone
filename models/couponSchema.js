const mongoose = require("mongoose");
const { Schema } = mongoose;

const couponSchema = new Schema({
    users: [{
        type: Schema.Types.ObjectId,
        ref: "User",
        // required: true,
        count: {
            type: Number,
            default: 0

        },
    }],
    usageLimit: {
        type: Number,
        default: Infinity
    },
    usageLimitPerUser: {
        type: Number,
        default: 1
    },
    couponCode: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    createdOn: {
        type: Date,
        default: Date.now
    },
    expireOn: {
        type: Date,
        required: true
    },
    offerPrice: {
        type: Number,
        required: true,
    },
    minimumPrice: {
        type: Number,
        required: true
    },
    couponType: {
        type: String,
        enum: ["percentage", "fixed","free_shipping"],
        required: true
    },
    source: {
        type: String,
        enum: ['referral', 'admin', 'promotion'],
        default: 'admin'
    },
    description: {
        type: String,
        required: false
    },
    status: {
        type: Boolean,
        default: true
    },
    //     expireOn: {
    //   type: Date,
    //   required: true,
    //   validate: {
    //     validator: function(value) {
    //       return value > this.createdOn;
    //     },
    //     message: "Expiry date must be after creation date."
    //   }
    // }


})

const Coupon = mongoose.model("Coupon", couponSchema);

module.exports = Coupon