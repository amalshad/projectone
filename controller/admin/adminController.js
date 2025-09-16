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

        
        let matchCondition = getDateRange(period, startDate, endDate, customRange);

        
        const salesData = await getSalesData(matchCondition);
        const chartData = await getChartData(matchCondition, period);
        const topProducts = await getTopProducts(matchCondition);

        
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


const getSalesReportData = async (req, res) => {
    try {
        const { period, startDate, endDate, customRange } = req.query;

        let matchCondition = getDateRange(period, startDate, endDate, customRange);

        const salesData = await getSalesData(matchCondition);
        const chartData = await getChartData(matchCondition, period);
        const topProducts = await getTopProducts(matchCondition);
        const overallMetrics = calculateOverallMetrics(salesData);

        res.json({ success: true, data: { salesData, chartData,topProducts, overallMetrics } });

    } catch (error) {
        console.error("Error fetching sales report data:", error);
        res.status(500).json({ success: false, message: "Failed to fetch sales data" });
    }
};


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

const exportSalesReport = async (req, res) => {
    try {
        const { period = 'monthly', startDate, endDate, customRange, format = 'xlsx' } = req.query;
        
        
        let matchCondition = getDateRange(period, startDate, endDate, customRange);
        
        
        const salesData = await getSalesData(matchCondition);
        const overallMetrics = calculateOverallMetrics(salesData);
        
        
        const exportData = salesData.map((order, index) => ({
            'Sr. No.': index + 1,
            'Order ID': '#' + order._id.toString().slice(-8).toUpperCase(),
            'Customer Name': order.customerName || 'Guest',
            'Customer Email': order.customerEmail || 'N/A',
            'Order Date': new Date(order.orderDate).toLocaleDateString('en-IN'),
            'Payment Method': order.paymentMethod || 'COD',
            'Payment Status': order.paymentStatus || 'Pending',
            'Order Status': order.status || 'Processing',
            'Total Amount': order.totalAmount || 0,
            'Discount': order.discount || 0,
            'Shipping': order.shippingPrice || 0,
            'Final Amount': order.finalAmount || 0,
            'Items Count': order.itemsCount || 0
        }));

        
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `sales-report-${period}-${timestamp}`;

        if (format === 'csv') {
            await exportToCSV(res, exportData, overallMetrics, filename);
        } else if (format === 'xlsx') {
            await exportToExcel(res, exportData, overallMetrics, filename, period);
        } else if (format === 'pdf') {
            await exportToPDF(res, exportData, overallMetrics, filename, period);
        } else {
            res.status(400).json({ success: false, message: 'Unsupported export format' });
        }

    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate export' });
    }
};


async function exportToCSV(res, data, metrics, filename) {
    try {
        const fields = [
            'Sr. No.', 'Order ID', 'Customer Name', 'Customer Email', 'Order Date',
            'Payment Method', 'Payment Status', 'Order Status', 'Total Amount',
            'Discount', 'Shipping', 'Final Amount', 'Items Count'
        ];

        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(data);

        
        const summary = [
            '# ShadElectro Sales Report',
            `# Generated on: ${new Date().toLocaleDateString('en-IN')}`,
            `# Total Orders: ${metrics.totalOrders}`,
            `# Total Revenue: Rs.${metrics.totalRevenue.toLocaleString('en-IN')}`,
            `# Total Discounts: Rs.${metrics.totalDiscount.toLocaleString('en-IN')}`,
            `# Net Revenue: Rs.${metrics.netRevenue.toLocaleString('en-IN')}`,
            '',
            ''
        ].join('\n');

        res.header('Content-Type', 'text/csv; charset=utf-8');
        res.header('Content-Disposition', `attachment; filename="${filename}.csv"`);
        res.send(summary + csv);

    } catch (error) {
        throw error;
    }
}


async function exportToExcel(res, data, metrics, filename, period) {
    try {
        const workbook = new ExcelJS.Workbook();
        
        
        workbook.creator = 'ShadElectro Admin';
        workbook.lastModifiedBy = 'ShadElectro Admin';
        workbook.created = new Date();
        workbook.modified = new Date();

        
        const summarySheet = workbook.addWorksheet('Summary');
        
        
        summarySheet.mergeCells('A1:D1');
        summarySheet.getCell('A1').value = 'ShadElectro - Sales Report Summary';
        summarySheet.getCell('A1').font = { size: 16, bold: true, color: { argb: '8a2be2' } };
        summarySheet.getCell('A1').alignment = { horizontal: 'center' };

        summarySheet.addRow([]);
        summarySheet.addRow(['Report Period:', period.toUpperCase()]);
        summarySheet.addRow(['Generated On:', new Date().toLocaleDateString('en-IN')]);
        summarySheet.addRow([]);
        summarySheet.addRow(['Total Orders:', metrics.totalOrders]);
        summarySheet.addRow(['Total Revenue:', `Rs.${metrics.totalRevenue.toLocaleString('en-IN')}`]);
        summarySheet.addRow(['Total Discounts:', `Rs.${metrics.totalDiscount.toLocaleString('en-IN')}`]);
        summarySheet.addRow(['Net Revenue:', `Rs.${metrics.netRevenue.toLocaleString('en-IN')}`]);
        summarySheet.addRow(['Average Order Value:', `Rs.${metrics.averageOrderValue.toFixed(2)}`]);
        summarySheet.addRow(['Coupon Usage Rate:', `${metrics.couponUsageRate}%`]);

        
        const dataSheet = workbook.addWorksheet('Orders Details');

        
        dataSheet.columns = [
            { header: 'Sr. No.', key: 'Sr. No.', width: 8 },
            { header: 'Order ID', key: 'Order ID', width: 18 },
            { header: 'Customer Name', key: 'Customer Name', width: 25 },
            { header: 'Customer Email', key: 'Customer Email', width: 30 },
            { header: 'Order Date', key: 'Order Date', width: 15 },
            { header: 'Payment Method', key: 'Payment Method', width: 18 },
            { header: 'Payment Status', key: 'Payment Status', width: 18 },
            { header: 'Order Status', key: 'Order Status', width: 15 },
            { header: 'Total Amount', key: 'Total Amount', width: 15 },
            { header: 'Discount', key: 'Discount', width: 12 },
            { header: 'Shipping', key: 'Shipping', width: 12 },
            { header: 'Final Amount', key: 'Final Amount', width: 15 },
            { header: 'Items Count', key: 'Items Count', width: 12 }
        ];

        
        dataSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
        dataSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '8a2be2' } };
        dataSheet.getRow(1).alignment = { horizontal: 'center' };

        
        data.forEach(row => {
            dataSheet.addRow(row);
        });

        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        throw error;
    }
}


async function exportToPDF(res, data, metrics, filename, period) {
    try {
        const doc = new PDFDocument({ 
            size: 'A4', 
            margin: 40,
            info: {
                Title: 'Sales Report - ShadElectro',
                Author: 'ShadElectro Admin',
                Subject: 'Sales Report'
            }
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);

        doc.pipe(res);

        
        doc.fontSize(20).fillColor('#8a2be2').text('ShadElectro', 40, 40);
        doc.fontSize(16).fillColor('#000000').text('Sales Report', 40, 70);
        doc.fontSize(12).text(`Period: ${period.toUpperCase()}`, 40, 95);
        doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 40, 115);
        
        
        doc.rect(40, 140, 520, 100).strokeColor('#8a2be2').stroke();
        doc.fontSize(14).fillColor('#8a2be2').text('Summary', 50, 150);
        
        doc.fontSize(10).fillColor('#000000')
            .text(`Total Orders: ${metrics.totalOrders}`, 50, 175)
            .text(`Total Revenue: Rs.${metrics.totalRevenue.toLocaleString('en-IN')}`, 50, 190)
            .text(`Total Discounts: Rs.${metrics.totalDiscount.toLocaleString('en-IN')}`, 50, 205)
            .text(`Net Revenue: Rs.${metrics.netRevenue.toLocaleString('en-IN')}`, 300, 175)
            .text(`Average Order Value: Rs.${metrics.averageOrderValue.toFixed(2)}`, 300, 190)
            .text(`Coupon Usage Rate: ${metrics.couponUsageRate}%`, 300, 205);

       
        let y = 270;
        doc.fontSize(9).fillColor('#8a2be2');
        doc.text('Order ID', 40, y);
        doc.text('Customer', 120, y);
        doc.text('Date', 220, y);
        doc.text('Amount', 270, y);
        doc.text('Discount', 320, y);
        doc.text('Final', 370, y);
        doc.text('Status', 420, y);

        
        doc.strokeColor('#8a2be2').moveTo(40, y + 15).lineTo(560, y + 15).stroke();

        y += 25;
        doc.fontSize(8).fillColor('#000000');

        
        data.forEach((row, index) => {
            if (y > 750) {
                doc.addPage();
                y = 50;
                
                
                doc.fontSize(9).fillColor('#8a2be2');
                doc.text('Order ID', 40, y);
                doc.text('Customer', 120, y);
                doc.text('Date', 220, y);
                doc.text('Amount', 270, y);
                doc.text('Discount', 320, y);
                doc.text('Final', 370, y);
                doc.text('Status', 420, y);
                
                doc.strokeColor('#8a2be2').moveTo(40, y + 15).lineTo(560, y + 15).stroke();
                y += 25;
                doc.fontSize(8).fillColor('#000000');
            }

            doc.text(row['Order ID'].substring(0, 12), 40, y);
            doc.text(row['Customer Name'].substring(0, 15), 120, y);
            doc.text(row['Order Date'], 220, y);
            doc.text(`Rs.${row['Total Amount'].toLocaleString()}`, 270, y);
            doc.text(`Rs.${row['Discount'].toLocaleString()}`, 320, y);
            doc.text(`Rs.${row['Final Amount'].toLocaleString()}`, 370, y);
            doc.text(row['Order Status'].substring(0, 10), 420, y);

            y += 18;

            s
            if ((index + 1) % 5 === 0) {
                doc.strokeColor('#e0e0e0').moveTo(40, y).lineTo(560, y).stroke();
                y += 5;
            }
        });

        
        doc.fontSize(8).fillColor('#666666')
            .text(`Generated by ShadElectro Admin Panel on ${new Date().toLocaleString('en-IN')}`, 40, doc.page.height - 50);

        doc.end();

    } catch (error) {
        throw error;
    }
}

module.exports = { loadLogin, login, page_error, logout, loadSalesReport, getSalesReportData ,exportSalesReport }