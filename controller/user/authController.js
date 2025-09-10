const User = require("../../models/userSchema")
const nodemailer = require("nodemailer")
const env = require("dotenv").config()
const bcrypt = require("bcrypt")
const { sendVerificationEmail, generateOtp } = require('../../utils/authHelper')
const shortid = require('shortid');

// LOAD SIGUP
const loadSignup = async (req, res) => {
  try {

    res.render("signup", { message: null })

  } catch (error) {

    console.log("Error At Sigup", error)
    res.status(500).send("Server Error")
  }
}

// LOAD LOGIN
const loadLogin = async (req, res) => {
  try {

    res.render("login", { message: "" })

  } catch (error) {

    console.log("Error At loadLogin", error)
    res.status(500).send("Server Error")
  }
}



// SIGN UP
const signup = async (req, res) => {

  const { name, email, password, confirmPassword, referralCode } = req.body
  try {
    const find = await User.findOne({ email })

    if (password !== confirmPassword) return res.render("signup", { message: "Password not matching" })

    if (find) return res.render("signup", { message: "User already exist" });

    if (referralCode) {

      const isfind = await User.findOne({ referralCode })
      if (isfind) return res.json({ success: false, message: "Code already exist" });

    } else {

      referralCode = shortid.generate();
    }


    const otp = generateOtp()

    const emailSent = await sendVerificationEmail(email, otp)
    if (!emailSent) {
      return res.json("email-error")
    }

    req.session.userOtp = otp
    req.session.userData = { name, email, password, referralCode }

    res.redirect("/verify-otp");

    console.log("OTP sent", otp)

  } catch (error) {
    console.log("Error at adduser", error);
    res.status(500).send("Internal Server Error")
  }
}

const loadVerifyOtp = async (req, res) => {
  try {

    if (req.session.user) {

      res.redirect('/')

    } else {

      res.render('verify-otp')

    }
  } catch (error) {

    console.error("Load Verify Otp",error)
  }
}


const verifyOtp = async (req, res) => {
  try {

    const { otp } = req.body

    if (otp === req.session.userOtp) {
      
      const user = req.session.userData
      const hashpassword = await bcrypt.hash(user.password, 10)

      const saveUserdata = new User({
        name: user.name,
        email: user.email,
        password: hashpassword,
        referralCode: user.referralCode
      })

      await saveUserdata.save()

      req.session.user = saveUserdata._id;

      res.json({ success: true, redirectUrl: '/' })

    } else {
      res.status(400).json({ success: false, message: "Invalid OTP" })
    }

  } catch (error) {
    console.error("Error Verify OTP", error);
    res.status(500).json({ success: false, message: "An error occured" })
  }
}


const resendOTP = async (req, res) => {

  try {

    const { email } = req.session.userData
    if (!email) {

      return res.status(400).json({ success: false, message: "Email not found in session" })

    }

    const otp = generateOtp();
    req.session.userOtp = otp

    const emailSent = await sendVerificationEmail(email, otp);

    if (emailSent) {

      console.log("Resend OTP", otp);
      res.status(200).json({ success: true, message: "OTP Resend Successfully" })

    } else {

      res.status(500).json({ success: false, message: "failed toresend otp. Please try again" });
    }
  } catch (error) {

    console.error("Error resending OTP", error)
    res.status(500).json({ success: false, message: "internal server error.Plaese try again" })

  }
}


const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.trim(), isAdmin: 0 });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: "User is blocked by admin" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    req.session.user = user._id;

    return res.status(200).json({ message: "Login successful", redirect: "/" });

  } catch (err) {
    console.error("Login error:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};



const logout = async (req, res) => {


  try {
    if (req.session.user || req.session.passport?.user) {


      if (req.session.passport?.user) {
        delete req.session.passport.user;
      }
      if (req.session.user) {
        delete req.session.user;
      }
    }


    res.redirect("/login")

  } catch (error) {
    console.log("Logout error", error);
    res.redirect("/404")
  }


}


const loadForgotPassword = async (req, res) => {
  try {
    const message = req.session.message
    delete req.session.message


    res.render("forgot", { message, success: "" })

  } catch (error) {
    console.error("Error at loadForgotPassword", error)
    res.redirect("/login")
  }
}


const forgotPassword = async (req, res) => {
  try {

    const { email } = req.body;
    const exist = await User.findOne({ email })


    if (!exist || exist.isAdmin) {
      req.session.message = "User not found"
      return res.redirect('/forgot')
    }

    const otp = generateOtp()

    req.session.userOtp = otp
    req.session.email = email

    const emailSent = await sendVerificationEmail(email, otp);
    if (!emailSent) {
      req.session.message = "Failed to send OTP. Please try again.";
      return res.redirect("/forgot");
    }

    console.log("Forgot otp", otp)
    res.redirect("/forgotOtp")

  } catch (error) {

    console.error("Error in forgotPassword:", error);
    res.status(500).send("Internal Server Error");
  }
}


const loadForgotOtp = async (req, res) => {
  try {
    if (req.session.email) {

      res.render("forgotOtp")
    } else {
      res.redirect("/login")
    }
  } catch (error) {

  }
}


const verifyForgotOtp = async (req, res) => {
  try {
    const { otp } = req.body
    // console.log("here", otp)

    // console.log(req.session.userOtp)

    if (req.session.userOtp == otp) {


      res.json({ success: true, redirectUrl: "/resetPassword" })
    } else {
      res.json({ message: "OTP is not verified" })
    }


  } catch (error) {

  }
}


const loadResetPassword = async (req, res) => {
  const email = req.session.email
  try {
    if (email) {

      res.render("resetPassword", { message: "", success: "", email })
    } else {
      res.redirect("/login")
    }
  } catch (error) {
    console.error("Error at forgot loadResetPassword", error)
    res.redirect("/404")
  }
}


const resetPassword = async (req, res) => {
  try {

    const { email, password } = req.body
    const hashpassword = await bcrypt.hash(password, 10)
    await User.findOneAndUpdate({ email: email }, { $set: { password: hashpassword } })
    console.log("updated")
    res.redirect("/login")

  } catch (error) {
    console.error("Error at resetPassword", error)
    res.redirect("/404")
  }
}

// FORGOT RESEND OTP
const forgotResendOtp = async (req, res) => {
  try {
    const otp = generateOtp()
    req.session.userOtp = otp
    const email = req.session.email
    const emailSent = await sendVerificationEmail(email, otp);
    console.log("re", otp);

    if (emailSent) {

      console.log("Resend OTP", otp);
      res.status(200).json({ success: true, message: "OTP Resend Successfully" })

    } else {

      res.status(500).json({ success: false, message: "failed to resend otp. Please try again" });
    }



  } catch (error) {
    console.error("Error at forgot resendotp", error)
    res.redirect("/404")
  }
}


module.exports = {
  loadLogin,
  loadSignup,
  signup,
  loadVerifyOtp,
  verifyOtp,
  resendOTP,
  login,
  logout,
  loadForgotPassword,
  forgotPassword,
  loadForgotOtp,
  verifyForgotOtp,
  loadResetPassword,
  resetPassword,
  forgotResendOtp
}