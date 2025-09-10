const User = require("../../models/userSchema")
const Category = require("../../models/categorySchema");
const Wishlist = require("../../models/wishlistSchema")
const Product = require("../../models/productSchema")


const loadWishlist = async (req, res) => {
  try {
    let user = req.session.passport?.user || req.session.user

    let userData = await User.findById(user);

    const categories = await Category.find()

    const wishlist = await Wishlist.findOne({ userId: user }).populate("products.productId");

    const wishlistProductIds = wishlist?.products.map(p => p.productId._id.toString()) || [];

    const categoryIds = wishlist?.products.map(item => item.productId?.category?.toString()).filter(Boolean);

    const relatedProducts = await Product.find({ category: { $in: categoryIds }, _id: { $nin: wishlistProductIds }, isBlocked: false });

    res.render("wishlist", {
      title: "Shad Electro",
      user: userData,
      orders: "",
      categories,
      wishlist: wishlist || { products: [] },
      relatedProducts,

    })

  } catch (error) {
    console.error("Error loading wishlist:", error);
     res.status(500).json({ success: false, message: "Server error" });
  }
}


const addWishlist = async (req, res) => {
  try {

    const userId = req.session.passport?.user || req.session.user;
    const { productId } = req.body;

    let wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {

      wishlist = new Wishlist({ userId, products: [{ productId }] });
    }
    else {

      const exists = wishlist.products.some(item => item.productId.toString() === productId);

      if (exists) {
        return res.json({ success: false, message: "Already in wishlist" });
      }

      wishlist.products.push({ productId });
    }

    await wishlist.save();
    res.json({ success: true, message: "Added to wishlist" });

  } catch (error) {

    console.error("Wishlist error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


const removeWishlist = async (req, res) => {
  try {

    const userId = req.session.passport?.user || req.session.user
    const { productId } = req.params

    await Wishlist.updateOne({ userId }, { $pull: { products: { productId } } });

    res.json({ success: true, message: "Item removed" })

  } catch (error) {

    console.error('Remove wishlist error', err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}


module.exports = { loadWishlist, addWishlist, removeWishlist }