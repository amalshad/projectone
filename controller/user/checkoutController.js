const Address = require("../../models/addresSchema")
const User = require("../../models/userSchema")
const Category = require("../../models/categorySchema");
const Product = require("../../models/productSchema")
const Cart = require('../../models/cartSchema')
const Order = require('../../models/orderSchema')
const env = require("dotenv")


const loadCheckout = async (req, res) => {
  try {
    const id = req.session.user || req.session.passport?.user
    const cart = await Cart.findOne({ userId: id }).populate("items.productId");

    const categories = await Category.find()

    const addresses = await Address.findOne({ userId: id })



    const user = await User.findById(id)
    res.render('checkout', {
      title: "Shad Electro",
      user,
      cart,
      categories,
      addresses

    })
  } catch (error) {
    console.error("Error At CheckOut", error)
    res.status(500).json({ success: false, message: "Server Error" })
  }
}


const checkout = async (req, res) => {

  try {

    const userId = req.session.user || req.session.passport?.user;
    const { selectedAddressId, paymentMethod, shippingPrice, subtotal, discount } = req.body;


    const cart = await Cart.findOne({ userId }).populate("items.productId");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }


    const orderedItems = await Promise.all(cart.items.map(async (item) => {
      const product = await Product.findById(item.productId);
      return {
        product: item.productId._id,
        variantIndex: item.variantIndex,
        quantity: item.quantity,
        price: product.variants[item.variantIndex].salesPrice,
        status: "Processing"
      };
    }));


    const addressDoc = await Address.findOne({ userId });
    const selectedAddress = addressDoc.address.find(addr => addr._id.toString() === selectedAddressId);

    if (!selectedAddress) {
      return res.status(400).json({ success: false, message: "Address not found" });
    }

    const newOrder = new Order({
      userId,
      orderedItems,
      totalPrice: parseFloat(subtotal),
      discount: parseFloat(discount) || 0,
      finalAmount: Number(subtotal) + Number(shippingPrice),
      shippingPrice,
      shippingAddress: selectedAddress,
      paymentMethod,
      paymentStatus: paymentMethod === "cod" ? "Pending" : "Paid",
      status: "Processing",
      couponApplied: discount > 0,
      invoiceDate: new Date()
    });

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



module.exports = { loadCheckout, checkout, orderSuccess, createRazorpayOrder }