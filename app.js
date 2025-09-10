const express = require('express');
const path = require('path');
const app = express();
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require("./routes/adminRoutes");
const env = require('dotenv').config();
const db = require("./config/db");
const session = require("express-session");
const nocache = require("nocache")
const passport = require("./config/passport");
db()

// Parse
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Session
app.use(nocache())
app.use(session({
  secret: process.env.SESSION_KEY,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 72 * 60 * 60 * 1000
  }
}))


app.use(passport.initialize())
app.use(passport.session())

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', [path.join(__dirname, 'views/user'), path.join(__dirname, 'views/admin')]);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));



// Routes
app.use('/', userRoutes)
app.use('/admin', adminRoutes);

app.use((req, res, next) => {
  res.locals.currentUrl = req.path;
  next();
});

// Start the server
app.listen(process.env.PORT, () => {
  console.log(`Server running at http://localhost:${process.env.PORT}`);
});