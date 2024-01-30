const express = require("express");
const nocache = require("nocache");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const router = express.Router();
const register = require("../model/account");
require("dotenv").config();
const session = require("express-session");
const catcollection = require("../model/category");
const productcollection = require("../model/product");
const cartcollection = require('../model/cart')
const usercollection = require('../model/account')
const userProfile = require('../model/profile');
const Address = require('../model/address');
const OrderDb = require('../model/order'); 
const order = require('../model/order')
const cart = require('../model/cart')
const offerdb = require('../model/productoffer')
const wallet = require('../model/wallet')
const wishlistdb = require('../model/wishlist')
const bannersdb = require('../model/banner')
const mongoose = require('mongoose');
const { log } = require("console");

router.use(nocache());
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

router.use(
  session({
    secret: "secret key",
    resave: false,
    saveUninitialized: true,
  })
);

exports.home = async(req, res) => {
  if (req.session.user) {
   
    res.redirect("/index");
  } else {
   
   
    const categoery = await catcollection.find();
    const products = await productcollection.find({ status: false }).populate('category')
   
    const currentDate = new Date();
    const offers = await offerdb.find({
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
    });
   
    res.render("guest",{ categoery, products,offers });
  }
  
};

exports.signup = (req, res) => {
  // console.log(req.session.sample);
  let message = " ";
  res.render("signup", { message });
};
let data;
let email;
let otpvalue;

exports.psignup = async (req, res) => {
  console.log("asa",req.body);
  
      let referalgenerate = generateReferralCode(8);
          console.log("Gneerate", referalgenerate);
      data = {
        username: req.body.Username,
        email: req.body.email,
        password: req.body.password,
        referralCode : referalgenerate,
        wallet:0
      };
      req.session.user = data._id;

      

          if (req.body.referralCode) {
            let code = req.body.referralCode;
            users = await usercollection.findOne({ referralCode: code });
            if (users) {
              const referaluser = await usercollection.findOne({
                referralCode: code,
              });
              await usercollection
                .updateOne({ referralCode: code }, { $inc: { wallet: 100 } })
                .then((x) => {
                  console.log("100 rs added");
                });
              // Update the wallet for the user
              const walletUpdate = new wallet({
                Email: referaluser.email,
                date: new Date(),
                amount: 100,
                creditordebit: "Credited",
              });
  
              await walletUpdate.save();
            } else {
              return res
                .status(400)
                .json({ success: false, message: "Referral code not found" });
            }
          }
      
      const find = await register.findOne({ email: req.body.email });
      if (find) {
          res.status(400).json({ success: false, message: "Email already exists" });
      } else {
      
        //await register.insertMany([data])
        const otp = generateRandomString(6);

        // Send OTP email
        console.log(req.body.email);
        await sendOtpEmail(req.body.email, otp);
        console.log(otp);
        otpvalue = otp;
        return res
                .status(200)
                .json({ success: true, message: "Success" });

        // res.redirect('login')
      } 
    }
  


    const sendOtpEmail = async (email, otp) => {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_ADDRESS,
            pass: process.env.EMAIL_PASSWORD,
          },
        });
    
        const mailOptions = {
          from: 'your-email@gmail.com', // Replace with a valid email address
          to: email,
          subject: 'One-Time Password (OTP) for Authentication',
          text: `Your Authentication OTP is: ${otp}`,
        };
    
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.response);
      } catch (error) {
        console.error('Error:', error);
      }
    };
    
const generateRandomString = (length) => {
  const digits = "0123456789";
  let OTP = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, digits.length);
    OTP += digits[randomIndex];
  }

  return OTP;
};

const generateReferralCode = (length) => {
  const characters =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let referralCode = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    referralCode += characters[randomIndex];
  }
  return referralCode;
};

exports.login = (req, res) => {
  if (req.session.user) {
    res.redirect("/index");
    if ((req.session.user.status = false)) {
      res.render("login", { message: "You account seen as blocked" });
    }
  } else {
    let message=" ";
    res.render("login", { message });
  }
};

exports.index = async (req, res) => {
  let referalgenerate = generateReferralCode(8);
  console.log("Gneerate", referalgenerate);
  uid = req.session.user
  const user = await usercollection.findOne({_id:uid});
  const categoery = await catcollection.find();
  const products = await productcollection.find({ status: false }).populate('category')
  const userCart = await cartcollection.find({ userid: uid });
  const banners = await bannersdb.find()
  const currentDate = new Date();
  const offers = await offerdb.find({
    startDate: { $lte: currentDate },
    endDate: { $gte: currentDate },
  });
  cartlen = userCart.length
  res.render("index", { categoery, products,user,userCart,cartlen,offers,banners });
};

 

exports.plogin = async (req, res) => {
  const { email, password } = req.body;
  console.log(req.body);

  try {
    const data = await register.findOne({ email: email, password: password });
    // req.session.user = data._id;
    if (!data) {
      // If data is null, i.e., no user found with the given email and password
      return res.render("login", { message: "Incorrect email or password" });
    } else {
      req.session.user = data._id;
      res.redirect("/index");
    }
  } catch (err) {
    console.error(err);

    res.send("An error occurred during login");
  }
};

exports.resendotp = async (req, res) => {
  console.log("otp send");
  if (data && data.email) {
    console.log(data.email);
    const otp = generateRandomString(6);
    await sendOtpEmail(data.email, otp);
    otpvalue = otp;
    console.log(otpvalue);
    res.redirect("/otp");
  }
};

exports.otppost = async (req, res) => {
  try {
    const digit = req.body.otp;
    //  console.log(req.session);
    //  const otpvalue=digit

    if (otpvalue === digit) {
      await register.insertMany([data]).then(() => {
        console.log("inserted");
        res.redirect("/signup/login", 302);
      });
    } else {
      res.render("otp", { message: "enter the correct otp" });
    }
    console.log(digit);
  } catch (error) {
    console.log(error);
  }
};

exports.otp = (req, res) => {
  setTimeout(() => {
    otpvalue = "";
  }, 60000);
  res.render("otp", { message: "" });
};

exports.logout = (req, res) => {
  req.session.destroy();
  console.log("session value", req.session);
  res.redirect("/");
};

function isEmailValid(email) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

exports.detail = async (req, res) => {
  prdid = req.params.id;
  uid = req.session.user
  //userId = uid.us
  const user = await usercollection.findOne({_id:uid});
  const products = await productcollection.findOne({ _id: prdid });
  const categoery = await catcollection.find()
  const currentDate = new Date();
  const offers = await offerdb.find({
    startDate: { $lte: currentDate },
    endDate: { $gte: currentDate },
  });
  console.log(offers)
  res.render("detail", { products,user,categoery,offers });
};


exports.product_list = async (req, res) => {
  try {
    const userId = req.session.user;
    const user = await usercollection.findOne({ _id: userId });
    const categoery = await catcollection.find();

    const page = parseInt(req.query.page) || 1;
    const pageSize = 8; // Number of products per page

    let productsQuery = { status: false };

    // Filter by category
    const selectedCategory = req.query.category;
    if (selectedCategory) {
      productsQuery.category = selectedCategory;
    }

    // Sort by price range
    const priceRange = req.query.priceRange;
    if (priceRange) {
      const [minPrice, maxPrice] = priceRange.split('-');
      productsQuery.price = { $gte: parseInt(minPrice), $lte: parseInt(maxPrice) };
    }

    const productsCount = await productcollection.countDocuments(productsQuery);
    
    let products = await productcollection.find(productsQuery)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .exec();

    // Sort by price range
    const sortPrice = req.query.sortprice;
    if (sortPrice === 'lowToHigh') {
      products.sort((a, b) => a.price - b.price);
    } else if (sortPrice === 'highToLow') {
      products.sort((a, b) => b.price - a.price);
    }

    const totalPages = Math.ceil(productsCount / pageSize);

    res.render("shop_prd", {
      product: products,
      categoery,
      user,
      currentPage: page,
      totalPages: totalPages,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).send("Internal Server Error");
  }
};






// Assuming you have the following functions in your controller
function calculateSubtotal(cartItems) {
  return cartItems.reduce((total, item) => total + item.price, 0);
}

function calculateTotal(cartItems) {
  const subtotal = calculateSubtotal(cartItems);
  const shipping = 10; // You can change this based on your actual shipping logic
  return subtotal + shipping;
}

exports.categoryfilter = async (req, res) => {
  try {
    const userId = req.session.user;
    const catId = req.params.id;

    const user = await usercollection.findOne({ _id: userId });
    const categoery = await catcollection.findById(catId);
    console.log(categoery);
    if (!categoery) {
      return res.status(404).send('Category not found');
    }

    const products = await productcollection.find({
      category: new mongoose.Types.ObjectId(categoery._id),
      status: false
    });
    console.log(products);
    res.render("cat-productlist", { product: products, categoery, user });
  } catch (error) {
    console.error('Error filtering products by category:', error);
    res.status(500).send('Internal Server Error');
  }
};

exports.search=async(req,res)=>{
  try {
    console.log( req.query.search);
    const searchQuery = req.query.search;
    let productFilter = {};
    let categoryFilter = {};

    if (searchQuery) {
      const regexPattern = new RegExp(searchQuery, "i");

      // Find products matching the query
      productFilter = { productName: { $regex: regexPattern } };

      // Find categories matching the query
      // categoryFilter = { Name: { $regex: regexPattern } };
    }

    const matchingProducts = await productcollection.find(productFilter)
    const response = {
      products: matchingProducts
    };
    console.log(matchingProducts);
    res.json(response);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Error while searaching."});
  }
}

exports.getwishlist = async(req,res)=>{
  const userid = req.session.user;
  const user = await usercollection.findOne({ _id: userid });
  const categoery = await catcollection.find();
  const wishlist = await wishlistdb.find({userId:userid})
  res.render('wishlist',{wishlist,user,categoery})
}

exports.addtoWishlist = async (req, res) => {
  console.log("entered");
  const user = req.session.user;
  const username = user.username;
  let userId = user;
  const productId = req.params.productid;
  console.log("userID", userId);
  console.log("productID", productId);
  const productitem = await productcollection.findOne({ _id: productId });
  console.log("aaa", productitem);

  // Check if product already exists in wishlist
  const existingProduct = await wishlistdb.findOne({
    productId: productId,
    userId: userId,
  });

  if (existingProduct) {
    console.log("entered in existing");
    res.redirect("/wishlist");
  } else {
    try {
      const newWishlist = await wishlistdb.create({
        userId: userId,
        user: username,
        productId: productId,
        product: productitem.productName,
        price: productitem.price,
        image: productitem.images[0],
      });

      console.log('Wishlist item saved:', newWishlist);
      res.redirect("/wishlist");
    } catch (error) {
      console.error('Error saving wishlist item:', error);
      // Handle the error appropriately, you may want to send an error response or redirect to an error page
      res.status(500).send('Internal Server Error');
    }
  }
};

exports.removeWishlist = async (req,res)=>{
  try {
    id =req.params.id
    await wishlistdb.findByIdAndDelete({_id:id})
    res.redirect('/wishlist')
  } catch (err) {
    console.log(err)
    res.send('Error while trying to remove product from wishlist.')
  }
}