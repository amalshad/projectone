const pageController = require('../controller/user/pageController');
const authController = require('../controller/user/authController')
const addressController = require('../controller/user/addressController')
const profileController = require('../controller/user/profileController')
const cartController = require('../controller/user/cartController')
const checkoutController = require('../controller/user/checkoutController')
const orderController = require("../controller/user/orderController")
const walletController = require("../controller/user/walletController")
const wishlistController = require("../controller/user/wishlistController")


module.exports = {
    pageController, authController, addressController, profileController, cartController, checkoutController,
    orderController, walletController, wishlistController
}