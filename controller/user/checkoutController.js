const Address = require("../../models/addresSchema")
const User = require("../../models/userSchema")
const Category = require("../../models/categorySchema");
const Product = require("../../models/productSchema")
const Cart = require('../../models/cartSchema')
const Order = require('../../models/orderSchema')
const env = require("dotenv")
const Coupon = require("../../models/couponSchema")

const loadCheckout = async (req, res) => {
  try {
    const id = req.session.user || req.session.passport?.user
    const cart = await Cart.findOne({ userId: id }).populate("items.productId");

    const categories = await Category.find()

    const addresses = await Address.findOne({ userId: id })
    const coupons = await Coupon.find({ status: true, expireOn: { $gt: new Date() } }).lean();



    const user = await User.findById(id)
    res.render('checkout', {
      title: "Shad Electro",
      user,
      cart,
      categories,
      addresses,
      coupons

    })
  } catch (error) {
    console.error("Error At CheckOut", error)
    res.status(500).json({ success: false, message: "Server Error" })
  }
}

const crypto = require('crypto');

// Razorpay signature verification function
function verifyRazorpaySignature(orderId, paymentId, signature) {
  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_SECRET)
    .update(orderId + '|' + paymentId)
    .digest('hex');

  return generatedSignature === signature;
}

// Middleware to verify Razorpay payments
const razorpayVerificationMiddleware = async (req, res, next) => {
  try {
    const { paymentMethod, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Only verify if payment method is Razorpay
    if (paymentMethod === 'razorpay') {
      console.log('Verifying Razorpay payment...');

      // Check if all required fields are present
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({
          success: false,
          message: 'Missing Razorpay payment details'
        });
      }

      // Verify signature
      const isValidSignature = verifyRazorpaySignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );

      if (!isValidSignature) {
        console.log('Razorpay signature verification failed');
        return res.status(400).json({
          success: false,
          message: 'Payment verification failed. Invalid signature.'
        });
      }

      console.log('Razorpay signature verified successfully');

      // Add verified payment data to request for checkout function
      req.verifiedPayment = {
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        isVerified: true
      };
    }

    // Proceed to next middleware/function (checkout)
    next();

  } catch (error) {
    console.error('Error in Razorpay verification:', error);
    return res.status(500).json({
      success: false,
      message: 'Payment verification error'
    });
  }
};

const checkout = async (req, res) => {

  try {

    const userId = req.session.user || req.session.passport?.user;
    const { selectedAddressId, paymentMethod, shippingPrice, subtotal, discount } = req.body;

    const Discount=Number(discount)||0


    if (!paymentMethod) return res.status(400).json({ success: false, message: "Choose a payment method" })


    const cart = await Cart.findOne({ userId }).populate("items.productId");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }


    const orderedItemsraw = await Promise.all(cart.items.map(async (item) => {
      const product = await Product.findById(item.productId);
      if (product.variants[item.variantIndex].quantity < 1) return null;


      return {
        product: item.productId._id,
        variantIndex: item.variantIndex,
        quantity: item.quantity,
        price: product.variants[item.variantIndex].finalPrice,
        status: "Processing"
      };
    }));
    const orderedItems = orderedItemsraw.filter(item => item !== null)


    const addressDoc = await Address.findOne({ userId });
    const selectedAddress = addressDoc.address.find(addr => addr._id.toString() === selectedAddressId);

    if (!selectedAddress) {
      return res.status(400).json({ success: false, message: "Address not found" });
    }

    const val =Number(shippingPrice)
    console.log('cccc',val);
    
    const orderData = {
      userId,
      orderedItems,
      totalPrice: parseFloat(subtotal) - Discount,
      discount: parseFloat(discount) || 0,
      finalAmount: (Number(subtotal) - Discount) + Number(shippingPrice),
      shippingPrice:Number(shippingPrice),
      shippingAddress: selectedAddress,
      paymentMethod,
      paymentStatus: paymentMethod === "cod" ? "Pending" : "Paid",
      status: "Processing",
      couponApplied: discount > 0,
      invoiceDate: new Date()
    };
    console.log('vv',orderData.shippingPrice);
    console.log('tt',typeof orderData.shippingPrice);


    // Add Razorpay details if payment was verified
    if (req.verifiedPayment && req.verifiedPayment.isVerified) {
      orderData.razorpayPaymentId = req.verifiedPayment.razorpayPaymentId;
      orderData.razorpayOrderId = req.verifiedPayment.razorpayOrderId;
    }

    const newOrder = new Order(orderData);
    await newOrder.save();

    for (const item of orderedItems) {
      const product = await Product.findById(item.product);
      if (product && product.variants[item.variantIndex]) {
        product.variants[item.variantIndex].quantity -= item.quantity;
        if (product.variants[item.variantIndex].quantity < 0) {
          product.variants[item.variantIndex].quantity = 0;
        }
        await product.save();
      }
    }

    await Cart.findOneAndUpdate({ userId }, { items: [] });

    res.json({ success: true, orderId: newOrder._id });
  } catch (error) {

    console.error("Order creation error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}


const orderSuccess = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.user || req.session.passport?.user;

    if (!id) return res.redirec('/404')

    const user = await User.findById(userId);
    const order = await Order.findOne({ userId }).sort({ createdOn: -1 }).populate('orderedItems.product');
    const categories = await Category.find();

    res.render("order-success", {
      user,
      order,
      categories
    });
  } catch (error) {
    console.error("Order success error:", error);
    res.status(500).render("notfound", { message: "Something went wrong" });
  }
};

const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET
});

const createRazorpayOrder = async (req, res) => {
  try {

    const { amount } = req.body;

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `order_rcptid_${Date.now()}`
    });

    res.json({ success: true, order });
  } catch (err) {
    console.error("Razorpay error:", err);
    res.status(500).json({ success: false, message: "Failed to create Razorpay order" });
  }
};


const couponApply = async (req, res) => {
  try {


    const { couponCode, cartTotal, userId } = req.body;



    if (!couponCode) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }


    const coupon = await Coupon.findOne({ couponCode: couponCode.toUpperCase(), status: true, expireOn: { $gt: new Date() } });

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found or expired' });
    }


    if (cartTotal < coupon.minimumPrice) {
      return res.status(400).json({ success: false, message: `Minimum price of ₹${coupon.minimumPrice} required` });
    }

    if (coupon.usageLimit !== Infinity && coupon.usageLimit <= 0) {
      return res.status(400).json({ success: false, message: 'Coupon usage limit exceeded' });
    }


    if (userId) {
      const userEntry = coupon.users.find(u => u._id.toString() === userId);
      if (userEntry && userEntry.count >= coupon.usageLimitPerUser) {
        return res.status(400).json({ success: false, message: 'You have already used this coupon the maximum number of times' });
      }
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.couponType === 'percentage') {
      discountAmount = (coupon.offerPrice / 100) * cartTotal;

    } else if (coupon.couponType === 'fixed') {
      discountAmount = coupon.offerPrice;
    } else if (coupon.couponType === 'free_shipping') {
      // Handle free shipping logic as per your system (optional)
    }



    if (discountAmount > cartTotal) discountAmount = cartTotal;

    res.json({ success: true, message: 'Coupon applied successfully', discountAmount, couponCode: coupon.couponCode, couponId: coupon._id });

  } catch (error) {
    console.error("Error at coupon apply", error)
  }
}



module.exports = { loadCheckout, checkout, orderSuccess, createRazorpayOrder, razorpayVerificationMiddleware, couponApply }