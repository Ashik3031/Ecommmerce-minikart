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
const order = require('../model/order');
const coupen = require('../model/coupen');
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


exports.couponDetail = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 4; // Adjust the number of coupons per page as needed
  const skip = (page - 1) * limit;

  try {
    const totalCoupons = await coupen.countDocuments();
    const totalPages = Math.ceil(totalCoupons / limit);

    const coupons = await coupen.find().skip(skip).limit(limit).exec();

    res.render('coupenDetail', { coupons, totalPages, currentPage: page });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    res.status(500).send('Internal Server Error');
  }
};


exports.addcoupon = async(req,res)=>{
    res.render("addcoupon") 
  }

exports.addcouponpost = async(req,res)=>{
        console.log(req.body);
     
        try {
            const data = {
                coupencode: req.body.coupencode,
                discount: req.body.discount,
                expiredate: formatDate(req.body.expireDate),
                purchaseamount: req.body.purchaseamount,
            };
    
            await coupen.insertMany([data])
                .then((result) => {
                    // console.log('insereted the coupen', result);
                    res.redirect('/coupons')
                })
     
        } catch (error) {
            console.log(error);
        }
        function formatDate(inputDate) {
            const date = new Date(inputDate);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            
            return `${year}-${month}-${day}`;
        }
        
    }

    exports.checkCouponCode = async (req, res) => {
        const { coupencode } = req.body;
      
        try {
          const existingCoupon = await coupen.findOne({ coupencode });
      
          if (existingCoupon) {
            // Coupon code already exists
            return res.json({ exists: true });
          } else {
            // Coupon code does not exist
            return res.json({ exists: false });
          }
        } catch (error) {
          console.error('Error checking coupon code:', error);
          return res.status(500).json({ error: 'Internal Server Error' });
        }
      };