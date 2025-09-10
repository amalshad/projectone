const cron = require("node-cron")
const Coupon = require("../models/couponSchema")


const couponCron= cron.schedule('0 0 * * *', async (req, res) => {
    try {

        await Coupon.updateMany({ expireOn: { $lt: new Date() }, status: true }, { $set: { status: false } });
        console.log("Coupon Expired");

    } catch (error) {
        console.error("Error at Cron-Job", error)
    }
});

module.exports=couponCron