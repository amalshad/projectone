const User = require("../../models/userSchema");
const bcrypt = require("bcrypt")
const Order = require("../../models/orderSchema")
const Product = require("../../models/productSchema")
const Category = require("../../models/categorySchema")
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const { Parser } = require('json2csv');


const loadLogin = async (req, res) => {

    try {

        if (req.session.admin) {

            return res.redirect("/admin/dashboard")
        }

        res.render("adminLogin", { message: "" });

    } catch (error) {

        console.error("Error at load Admin login", error)
    }

}


const login = async (req, res) => {
    try {

        const { email, password } = req.body;
        const admin = await User.findOne({ email, isAdmin: true });
        if (admin) {

            const isMatch = await bcrypt.compare(password, admin.password)

            if (isMatch) {

                req.session.admin = admin._id
                return res.redirect("/admin/dashboard")

            } else {

                res.render("adminLogin", { message: "Password is not matching" })
            }
        } else {

            res.render("adminLogin", { message: "User not exist" })
        }

    } catch (error) {

        console.error("Error at adminLogin", error)
        return res.redirect("/admin/404");
    }
}

const page_error = async (req, res) => {

    res.render("page-error")
}

const logout = async (req, res) => {
    try {
        delete req.session.admin

        res.redirect("/admin/login")
    } catch (error) {
        console.error("Error at Logout", error);
        res.redirect("/admin/404")
    }
}

const loadSalesReport = async (req, res) => {
    try {
        const { period = 'monthly', startDate, endDate, customRange } = req.query;

        // Calculate date range based on period
        let matchCondition = getDateRange(period, startDate, endDate, customRange);

        // Get sales data with aggregation
        const salesData = await getSalesData(matchCondition);
        const chartData = await getChartData(matchCondition, period);
        const topProducts = await getTopProducts(matchCondition);

        // Calculate overall metrics
        const overallMetrics = calculateOverallMetrics(salesData);

        res.render("salesReport", {
            salesData,
            chartData,
            topProducts,
            overallMetrics,
            period,
            startDate: startDate || '',
            endDate: endDate || '',
            customRange: customRange || 'day'
        });

    } catch (error) {
        console.error("Error loading sales report:", error);
        res.redirect("/admin/404");
    }
};

// API endpoint for dynamic data
const getSalesReportData = async (req, res) => {
    try {
        const { period, startDate, endDate, customRange } = req.query;

        let matchCondition = getDateRange(period, startDate, endDate, customRange);

        const salesData = await getSalesData(matchCondition);
        const chartData = await getChartData(matchCondition, period);
        const overallMetrics = calculateOverallMetrics(salesData);

        res.json({ success: true, data: { salesData, chartData, overallMetrics } });

    } catch (error) {
        console.error("Error fetching sales report data:", error);
        res.status(500).json({ success: false, message: "Failed to fetch sales data" });
    }
};

// Helper function to get date range
function getDateRange(period, startDate, endDate, customRange) {
    const now = new Date();
    let matchCondition = {};

    switch (period) {
        case 'daily':
            matchCondition = {
                createdOn: {
                    $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
                    $lte: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
                }
            };
            break;

        case 'weekly':
            const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
            const weekEnd = new Date(now.setDate(now.getDate() - now.getDay() + 6));
            matchCondition = {
                createdOn: {
                    $gte: weekStart,
                    $lte: weekEnd
                }
            };
            break;

        case 'monthly':
            matchCondition = {
                createdOn: {
                    $gte: new Date(now.getFullYear(), now.getMonth(), 1),
                    $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0)
                }
            };
            break;

        case 'yearly':
            matchCondition = {
                createdOn: {
                    $gte: new Date(now.getFullYear(), 0, 1),
                    $lte: new Date(now.getFullYear(), 11, 31)
                }
            };
            break;

        case 'custom':
            if (startDate && endDate) {
                matchCondition = {
                    createdOn: {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate)
                    }
                };
            }
            break;
    }

    return matchCondition;
}

// Get detailed sales data
async function getSalesData(matchCondition) {
    return await Order.aggregate([
        { $match: matchCondition },
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "customer"
            }
        },
        { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
        {
            $project: {
                _id: 1,
                orderDate: "$createdOn",
                customerName: "$customer.name",
                customerEmail: "$customer.email",
                totalAmount: "$totalPrice",
                discount: { $ifNull: ["$discount", 0] },
                couponCode: "$couponApplied",
                shippingPrice: { $ifNull: ["$shippingPrice", 0] },
                finalAmount: "$finalAmount",
                paymentMethod: "$paymentMethod",
                paymentStatus: "$paymentStatus",
                status: "$status",
                itemsCount: { $size: "$orderedItems" }
            }
        },
        { $sort: { orderDate: -1 } }
    ]);
}

// Get chart data based on period
async function getChartData(matchCondition, period) {
    let groupBy = {};

    switch (period) {
        case 'daily':
            groupBy = { $hour: "$createdOn" };
            break;
        case 'weekly':
            groupBy = { $dayOfWeek: "$createdOn" };
            break;
        case 'monthly':
            groupBy = { $dayOfMonth: "$createdOn" };
            break;
        case 'yearly':
            groupBy = { $month: "$createdOn" };
            break;
        default:
            groupBy = { $dayOfMonth: "$createdOn" };
    }

    const chartData = await Order.aggregate([
        { $match: matchCondition },
        {
            $group: {
                _id: groupBy,
                totalSales: { $sum: "$finalAmount" },
                totalOrders: { $sum: 1 },
                totalDiscount: { $sum: { $ifNull: ["$discount", 0] } }
            }
        },
        { $sort: { "_id": 1 } }
    ]);

    return chartData;
}

// Get top selling products
async function getTopProducts(matchCondition) {
    return await Order.aggregate([
        { $match: matchCondition },
        { $unwind: "$orderedItems" },
        {
            $lookup: {
                from: "products",
                localField: "orderedItems.product",
                foreignField: "_id",
                as: "productDetails"
            }
        },
        { $unwind: "$productDetails" },
        {
            $group: {
                _id: "$orderedItems.product",
                productName: { $first: "$productDetails.productName" },
                totalQuantity: { $sum: "$orderedItems.quantity" },
                totalRevenue: { $sum: { $multiply: ["$orderedItems.quantity", "$orderedItems.price"] } }
            }
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 10 }
    ]);
}

// Calculate overall metrics
function calculateOverallMetrics(salesData) {
    const totalOrders = salesData.length;
    const totalRevenue = salesData.reduce((sum, order) => sum + order.finalAmount, 0);
    const totalDiscount = salesData.reduce((sum, order) => sum + order.discount, 0);
    const totalShipping = salesData.reduce((sum, order) => sum + order.shippingPrice, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const couponUsage = salesData.filter(order => order.couponCode).length;
    const couponUsageRate = totalOrders > 0 ? (couponUsage / totalOrders * 100).toFixed(2) : 0;

    return {
        totalOrders,
        totalRevenue,
        totalDiscount,
        totalShipping,
        averageOrderValue,
        couponUsage,
        couponUsageRate,
        netRevenue: totalRevenue - totalDiscount
    };
}

module.exports = { loadLogin, login, page_error, logout, loadSalesReport, getSalesReportData }