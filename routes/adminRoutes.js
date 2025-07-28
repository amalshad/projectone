const express = require("express");
const router = express.Router();
const adminController = require("../controller/admin/adminController")
const { userAuth, adminAuth } = require("../middlewares/auth")
const customerController = require("../controller/admin/customerController")
const categoryController = require("../controller/admin/categoryController")
const productController = require("../controller/admin/productController")
const ordersController = require("../controller/admin/ordersController")
const uploads = require("../middlewares/multer")

router.get("/404", adminController.page_error)


router.get("/login", adminController.loadLogin)
router.post("/login", adminController.login)
router.get("/dashboard", adminAuth, adminController.loadDashboard)
router.get("/logout", adminAuth, adminController.logout)


router.get("/users", adminAuth, customerController.customerInfo)
router.post("/userBlock/:id", customerController.blockCustomer)
router.post("/userUnblock/:id", customerController.unblockCustomer)


router.get("/category", adminAuth, categoryController.categoryInfo)
router.post("/addCategory", categoryController.addCategory)
router.post("/listCategory/:id", categoryController.listCategory)
router.post("/editCategory/:id", categoryController.editCategory);


router.get("/product", adminAuth, productController.loadProduct)
router.get("/productAdd", adminAuth, productController.loadAddProduct)
router.post("/productAdd", uploads.any(), productController.addProduct);
router.get("/editProduct/:id", adminAuth, productController.loadEditProduct)
router.post("/editProduct/:id", uploads.any(), productController.editProduct)
router.post("/listProduct/:id", productController.listProduct)

router.get("/orders", ordersController.loadOrders)
router.get("/orders/:id", ordersController.orderDetail)
router.post("/orders/:id", ordersController.updateOrderStatus)
router.post("/orders/:orderId/:itemIndex",ordersController.updateItemStatus)




module.exports = router;