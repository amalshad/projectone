const User = require("../../models/userSchema");


const customerInfo = async (req, res) => {
    try {
        let search = req.query.search || "";

        let page = parseInt(req.query.page) || 1;
        const limit = 3;
        const query = {
            isAdmin: false,
            $or: [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } }
            ]
        };
        console.log(query);
        

        const users = await User.find(query)
            .sort({ createdOn: -1 })
            .limit(limit)
            .skip((page - 1) * limit)
            .exec();

        const count = await User.countDocuments(query)
        const totalPages = Math.ceil(count / limit)


        res.render("customerManage", {
            customers: users,
            currentPage: page,
            totalPages,
            search
        })

    } catch (error) {
        console.log("Error at Customer",error)
        res.redirect("/admin/404")
    }
}

const blockCustomer = async (req, res) => {
    try {
        const id = req.params.id

        await User.updateOne({ _id: id }, { $set: { isBlocked: true } })
        res.json({ success: true });
        
    } catch (error) {

        console.log("Error at block", error)
        res.status(500).json({ success: false, message: "User Block Failed" })

    }
};

const unblockCustomer = async (req, res) => {
    try {
        const id = req.params.id

        await User.updateOne({ _id: id }, { $set: { isBlocked: false } })
        res.json({ success: true })
    } catch (error) {

        console.log("error at unblock", error)
        res.status(500).json({ success: false, message: "User Unblock Failed" })
    }
}
module.exports = { customerInfo, blockCustomer, unblockCustomer }