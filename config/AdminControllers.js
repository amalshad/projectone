const customerController = require('../controller/admin/customerController')
const categoryController = require("../controller/admin/categoryController")
const productController = require("../controller/admin/productController")
const ordersController = require("../controller/admin/ordersController")
const couponController = require("../controller/admin/couponController")
const offerController = require("../controller/admin/offerController")
const dashboardController = require('../controller/admin/dashboardController')



module.exports = { customerController, categoryController, productController, ordersController, couponController, offerController, dashboardController }