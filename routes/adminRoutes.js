const express = require("express");
const router = express.Router();
const adminController = require("../controller/admin/adminController")
const { adminAuth } = require("../middlewares/auth")
const uploads = require("../middlewares/multer")
const AdminControllers = require('../config/AdminControllers')


router.get("/404", adminController.page_error)

router.get("/login", adminController.loadLogin)
router.post("/login", adminController.login)

router.get("/logout", adminAuth, adminController.logout)


router.get("/users",  AdminControllers.customerController.customerInfo)
router.post("/users/:id", adminAuth, AdminControllers.customerController.listCustomer)


router.get("/category",  AdminControllers.categoryController.categoryInfo)
router.post("/category", adminAuth, AdminControllers.categoryController.addCategory)
router.patch("/category/:id", adminAuth, AdminControllers.categoryController.listCategory)
router.put("/category/:id", adminAuth, AdminControllers.categoryController.editCategory);


router.get("/product", AdminControllers.productController.loadProduct)
router.get("/productAdd",  AdminControllers.productController.loadAddProduct)
router.post("/productAdd", adminAuth, uploads.any(), AdminControllers.productController.addProduct);
router.get("/editProduct/:id",   AdminControllers.productController.loadEditProduct)
router.post("/editProduct/:id", adminAuth, uploads.any(), AdminControllers.productController.editProduct)
router.patch("/listProduct/:id", adminAuth, AdminControllers.productController.listProduct)

router.get("/orders",  AdminControllers.ordersController.loadOrders)
router.get("/orders/:id", adminAuth, AdminControllers.ordersController.orderDetail)
router.patch("/orders/:id", adminAuth, AdminControllers.ordersController.updateOrderStatus)
router.patch("/orders/:orderId/:itemIndex", adminAuth, AdminControllers.ordersController.updateItemStatus)

router.get("/coupon", AdminControllers.couponController.loadCoupon)
router.post("/coupon", AdminControllers.couponController.addCoupon)
router.patch("/coupon/:id", AdminControllers.couponController.couponStatus)
router.put("/coupon/:id", AdminControllers.couponController.updateCoupon)
router.delete("/coupon/:id", AdminControllers.couponController.deleteCoupon)

router.get("/offers", AdminControllers.offerController.loadOfferPage)
router.post("/offers", AdminControllers.offerController.addOffer)
router.get("/offers/:id", AdminControllers.offerController.loadedit)
router.put("/offers/:id", AdminControllers.offerController.editOffer)
router.patch("/offers/:id", AdminControllers.offerController.offerStatus)
router.delete("/offers/:id", AdminControllers.offerController.deleteOffer)

router.get("/salesReport", adminController.loadSalesReport)
router.get('/sales-report', adminController.getSalesReportData);
router.get('/sales-report/export', adminController.exportSalesReport); // Optional export endpoint


router.get("/dashboard",  AdminControllers.dashboardController.loadDashboard)
router.post("/generate-ledger", AdminControllers.dashboardController.generateLedger)
router.get("/chart-data", AdminControllers.dashboardController.getChartData)





module.exports = router;