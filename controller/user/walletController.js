const Category = require("../../models/categorySchema")
const User = require("../../models/userSchema")
const Wallet = require("../../models/walletSchema")


const loadWallet =async(req,res)=>{
    try {
        
        const userId =req.session.user||req.session.passport?.user
        const user =await User.findById(userId)
        const categories=await Category.find()
        const wallet=await Wallet.findOne({userId})

        
        res.render("wallet",{
            user,categories,
            wallet:wallet || { balance: 0, transaction: [] }
        })
        
    } catch (error) {
        
    }
}


module.exports={loadWallet}