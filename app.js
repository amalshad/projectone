const express = require('express');
const path = require('path');
const app = express();
const env = require('dotenv').config();
const db =require("./config/db")
db()
// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

const {products,categories}=require('./data/data')

// Routes
app.get('/', (req, res) => {
  res.render('index', { 
    title: 'Shad Electro',
    products: products,
    categories: categories
  });
});
app.get("/login",(req,res)=>{
    res.render('user/login')
})

app.get("/register",(req,res)=>{
    res.render('user/register')
})
// Start the server
app.listen(process.env.PORT, () => {
  console.log(`Server running at http://localhost:${process.env.PORT}`);
});