const nodemailer = require("nodemailer")
const env = require("dotenv").config()



// GENERATE OTP
function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

// EMAIL VERIFICATION
async function sendVerificationEmail(email, otp) {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            port: 587,
            secure: false,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD
            }
        })

        const info = await transporter.sendMail({
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: "Verify your account",
            text: `Your OTP  is ${otp}`,
            html: `<b>Your OTP :${otp}</b>`
        })

        return info.accepted.length > 0

    } catch (error) {
        console.error("Error sending email", error)
        return false
    }

}

module.exports = { sendVerificationEmail, generateOtp }