const User=require("../../models/userSchema");
const bcrypt =require("bcrypt")

// LOAD lOGIN
const loadLogin=async(req,res)=>{
    if(req.session.admin){
        return res.redirect("/admin/dashboard")
    }
    res.render("adminLogin",{message:""});
}

// LOGIN
const login= async(req,res)=>{
    try {
       
        const {email,password}=req.body
        const admin =await User.findOne({email,isAdmin:true});
        if(admin){
        

            const isMatch = await bcrypt.compare(password,admin.password)
            if(isMatch){
        

                req.session.admin =admin._id
        

                return res.redirect("/admin/dashboard")
            }else{
                res.render("adminLogin",{message:"Password is not matching"})
            }

        }else{
            res.render("adminLogin",{message:"User not exist"})
        }
        
    } catch (error) {
        console.log("Error at adminLogin",error)
        return res.redirect("/pageerror");
    }
}
const loadDashboard =async(req,res)=>{
    try {

        if(req.session.admin){

            return res.render("dashboard")
        }else{
            res.redirect("/admin/login");
        }
       
    } catch (error) {
        
    }
    
}

const page_error =async(req,res)=>{
   
    
    res.render("page-error")
}

const logout =async(req,res)=>{
    try {
        delete req.session.admin
       
        res.redirect("/admin/login")
    } catch (error) {
        console.log("Error at Logout",error);
        res.redirect("/admin/404")
    }
}


module.exports={loadLogin,login,loadDashboard,page_error,logout}