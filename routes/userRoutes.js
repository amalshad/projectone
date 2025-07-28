const express = require('express');
const userController = require('../controller/user/userController');
const authController = require('../controller/user/authController')
const addressController = require('../controller/user/addressController')
const profileController = require('../controller/user/profileController')
const cartController = require('../controller/user/cartController')
const checkoutController = require('../controller/user/checkoutController')
const orderController = require("../controller/user/orderController")
const walletController = require("../controller/user/walletController")
const passport = require('passport');
const router = express.Router();
const { userAuth, userBlock, sessionAuth } = require("../middlewares/auth")
const multer = require('multer');
const upload = multer();

router.get("/404", userController.pageNotFound);

router.get("/", userBlock, userController.loadHome);

router.get("/login",userAuth, authController.loadLogin)
router.post("/login",userAuth, authController.login)

router.get("/signup", userAuth, authController.loadSignup)
router.post("/signup", userAuth,authController.signup)

router.get("/verify-otp", userAuth, authController.loadVerifyOtp)
router.post('/verify-otp', userAuth, authController.verifyOtp)
router.post("/resend-otp", userAuth, authController.resendOTP)

router.get("/logout", authController.logout)

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/signup" }), (req, res) => {
        res.redirect('/');
});

router.get("/forgot", authController.loadForgotPassword)
router.post("/forgot", authController.forgotPassword)
router.get("/forgotOtp", authController.loadForgotOtp)
router.post("/forgotOtp", authController.verifyForgotOtp)
router.get("/resetPassword", authController.loadResetPassword)
router.post("/resetPassword", authController.resetPassword)
router.post("/forgotResend", authController.forgotResendOtp)

router.get("/shop", userBlock, userController.loadShop)
router.get("/shop/:id", userBlock, userController.loadProductDetail);

router.get("/profile", sessionAuth, profileController.loadUserProfile)
router.patch("/profile", sessionAuth, profileController.updateUserProfile)

router.get("/address", sessionAuth, addressController.loadAddress)
router.post("/address", sessionAuth, addressController.addAddress)
router.patch("/address/:id", sessionAuth, addressController.editAddress)
router.delete("/address/:id", sessionAuth, addressController.deleteAddress)

router.get("/security", sessionAuth, profileController.loadSecurity)
router.patch("/reset-password", sessionAuth, profileController.resetPassword)
router.post("/reset-email", sessionAuth, profileController.resetEmail)
router.post("/resendEmail", sessionAuth, profileController.resendEmailOtp)
router.post("/confirm-otp", sessionAuth, profileController.confirmOtp)

router.get("/cart", sessionAuth, cartController.loadCart)
router.post("/addCart", sessionAuth, cartController.addCart)
router.delete("/removeCart/:id", sessionAuth, cartController.removeItem)
router.get('/productVariant/:productId', sessionAuth, cartController.getProductVariant);
router.put("/cartUpdate", sessionAuth, cartController.updateCartItem)

router.get("/wishlist", sessionAuth, profileController.loadWishlist)
router.post("/wishlist", sessionAuth, profileController.addWishlist)
router.delete("/wishlist/:productId", sessionAuth, profileController.removeWishlist)

router.get("/checkout", sessionAuth, checkoutController.loadCheckout)
router.post("/placeOrder", sessionAuth, upload.none(), checkoutController.checkout)
router.get('/order-success/:id', sessionAuth, checkoutController.orderSuccess)

router.get("/orders", sessionAuth, orderController.loadOrder)
router.post("/cancelItem", sessionAuth, orderController.cancelItem)
router.post("/cancelOrder/:orderId", sessionAuth, orderController.cancelOrder)
router.get("/orderDetail/:id", sessionAuth, orderController.loadOrderDetail)
router.post("/returnOrder/:orderId", sessionAuth, orderController.returnOrder)
router.post("/returnItem/:orderId/:itemIndex", sessionAuth, orderController.returnItem)

router.get("/wallet", sessionAuth, walletController.loadWallet)

router.post('/create-razorpay-order', checkoutController.createRazorpayOrder);

module.exports = router;