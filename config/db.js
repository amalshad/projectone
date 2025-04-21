const mongoose =require('mongoose');
const env =require('dotenv').config();



const connectDB =async()=>{
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        console.log("DB connected");
        
    } catch (error) {
        console.log("ERROR :",error)
        process.exit(1)
    }
}

module.exports=connectDB;