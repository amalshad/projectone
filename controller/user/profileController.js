const User = require("../../models/userSchema")
const Category = require("../../models/categorySchema");
const bcrypt = require("bcrypt")
const nodemailer = require("nodemailer")
const env = require("dotenv").config()
const Wishlist = require("../../models/wishlistSchema")
const Product = require("../../models/productSchema")
const { sendVerificationEmail, generateOtp } = require('../../utils/authHelper')

const loadUserProfile = async (req, res) => {
  try {

    if (req.session.passport?.user || req.session.user) {
      let user = req.session.passport?.user || req.session.user

      let userData = await User.findById(user);

      const categories = await Category.find()


      res.render("userProfile", {
        title: "Shad Electro",
        user: userData,
        orders: "",
        categories
      });
    } else {
      res.redirect("/login")
    }
  } catch (error) {
    console.error("Errot at Load userProfile", error)
    res.status(500).json({ success: false, message: "Internal server Error" })
  }
}
const updateUserProfile = async (req, res) => {
  try {

    const { name, phone, dateOfBirth, gender } = req.body
    const user = req.session.passport?.user || req.session.user
    await User.findOneAndUpdate({ _id: user }, {
      name,
      phone,
      dateOfBirth,
      gender,
    });
    res.json({ success: true, message: "User Updated Successfully" })

  } catch (error) {

    console.error('Profile update error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }


}

//----------------------------------------SECURITY---------------------------------------------------------------------

const loadSecurity = async (req, res) => {
  if (req.session.user) {

    let userData = await User.findById(req.session.user)
    const categories = await Category.find()

    res.render("userSecurity", {
      title: "Shad Electro",
      user: userData,
      orders: "",
      categories
    })

  } else if (req.session.passport?.user) {
    res.redirect("/profile")
  } else {
    res.redirect("/login")
  }

}

const resetPassword = async (req, res) => {
  try {


    const { currentPassword, newPassword, confirmPassword } = req.body;
    const user = await User.findById(req.session.user)


    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(400).json({ success: false, message: "Current Password is incorrect" });

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }

    const hashpassword = await bcrypt.hash(newPassword, 10)
    await User.findOneAndUpdate({ _id: req.session.user }, { $set: { password: hashpassword } })
    res.json({ success: true, message: "Password updated successfully" });

  } catch (error) {
    console.error("Error at resetPassword", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}


const resetEmail = async (req, res) => {
  try {
    const { newEmail, confirmPassword } = req.body

    const user = await User.findById(req.session.user)

    const match = await User.findOne({ email: newEmail })

    if (match) return res.status(400).json({ success: false, message: "Email is already exist" });

    const ismatch = await bcrypt.compare(confirmPassword, user.password);

    if (!ismatch) return res.status(400).json({ success: false, message: "Confirm Password is incorrect" });

    req.session.pendingEmail = newEmail.toLowerCase();

    const otp = generateOtp()

    const emailSent = await sendVerificationEmail(req.session.pendingEmail, otp)
    if (!emailSent) {
      return res.json("email-error")
    }
    req.session.userOtp = otp
    console.log(otp)

    return res.json({ success: true, message: "Verification required" });

  } catch (error) {
    console.error("Error at reset Email", error)
    res.status(400).json({ success: false, message: "Internal Server Error" })
  }
}

const confirmOtp = async (req, res) => {
  try {

    const { otp } = req.body
    if (req.session.userOtp === otp) {


      const user = await User.findById(req.session.user)

      user.email = req.session.pendingEmail
      await user.save()

      delete req.session.userOtp
      delete req.session.pendingEmail
      res.json({ success: true, message: "Valid Otp" })

    } else {
      res.status(400).json({ success: false, message: "Invalid OTP" })
    }

  } catch (error) {
    console.error("Error at confirmOtp", error)
    res.status(500).json({ success: false, message: "Internal Server Error" })
  }

}

const resendEmailOtp = async (req, res) => {
  try {
    const otp = generateOtp()
    req.session.userOtp = otp
    const emailSent = await sendVerificationEmail(req.session.pendingEmail, otp)
    console.log("Resend otp Of Email", otp);


    if (emailSent) {
      res.status(200).json({ success: true, message: " Otp Resended" })
    } else {
      res.status(500).json({ success: true, message: "Failed to sent Resend Otp" })
    }
  } catch (error) {
    console.error("Error at Resend email otp", error)
    res.redirect("/404")
  }
}

//----------------------------------------------WISHLIST ---------------------------------------------------------------

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
    res.status()
  }
}

const addWishlist = async (req, res) => {
  try {
    const userId = req.session.passport?.user || req.session.user;
    const { productId } = req.body;

    let wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      wishlist = new Wishlist({ userId, products: [{ productId }] });
    } else {
      const exists = wishlist.products.some(
        item => item.productId.toString() === productId
      );

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

module.exports = { loadUserProfile, updateUserProfile, loadSecurity, resetPassword, resetEmail, confirmOtp, loadWishlist, addWishlist, removeWishlist, resendEmailOtp }