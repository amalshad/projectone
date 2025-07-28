const mongoose =require('mongoose');
const {Schema}=mongoose;

const userSchema = new Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    phone:{
        type:String,
        required:false,
        unique:false,
        sparse:true,
        default:null
    },
    dateOfBirth:{
        type:Date,
        required:false,
        
    },
    gender:{
        type:String,
        // enum:["Male","Female","Other","Prefer not to say"],
        required:false,
        default:""
    },
    password:{
        type:String,
        required:false
    },
    profileImg:{
        type:String,
        require:false
    },
    googleId:{
        type:String,
        unique:true,
        sparse:true
    },
    isAdmin:{
        type:Boolean,
        default:false
    },
    isBlocked:{
        type:Boolean,
        default:false
    },
    cart:[{
        type:Schema.Types.ObjectId,
        ref:"Cart"
    }],
    wallet:[{
        type:Schema.Types.ObjectId,
        ref:"Whislist"
    }],
    orderHistory:[{
        type:Schema.Types.ObjectId,
        ref:"Order"
    }],
    createdOn:{
        type:Date,
        default:Date.now
    },
    referalCode:{
        type:String
    },
    redeemed:{
        type:Boolean,
        // default:false 
    },
    redeemedUser:[{
        type:Schema.Types.ObjectId,
        ref:"User"
    }],
    searchHistory:[{
        category:{
            type:Schema.Types.ObjectId,
            ref:"Category"
        },
        brand:{
            type:String,
        },
        searchOn:{
            type:Date,
            default:Date.now
        }
    }]
})

const User = mongoose.model("User",userSchema);

module.exports=User;