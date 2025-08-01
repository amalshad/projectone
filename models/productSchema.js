const mongoose =require("mongoose");
const { products } = require("../data/data");
const {Schema}=mongoose;

const productSchema = new Schema({
    productName:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    category:{
        type:Schema.Types.ObjectId,
        ref:"Category",
        required:true
    },
    isBlocked:{
        type:Boolean,
        default:false
    },
    status:{
        type:String,
        enum:["Available","Out Of Stock","Discountinued"],
        required:true,
        default:"Available",
    },
    variants:[
        {
            regularPrice:{
                type:Number,
                required:true
            },
            salesPrice:{
                type:Number,
                required:true
            },
            productOffer:{
                type:Number,
                default:0
            },
            quantity:{
                type:Number,
                required:0
            },
            color:{
                type:String,
                required:true
            },
            productImage:{
                type:[String],
                required:true
            },type:{
                type:String,
                required:true
            }
        }
    ]

},{timestamps:true});

const Product=mongoose.model("Product",productSchema);

module.exports=Product