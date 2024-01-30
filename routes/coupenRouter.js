const express = require("express");
const router = express();
const path = require("path");
// const usercontroller=require('../controllers/usercontroller')
const session = require("express-session");
const multer = require("multer");

router.use(
  session({
    secret: "secret key",
    resave: false,
    saveUninitialized: true,
  })
);

require("dotenv").config();

const checkSession = async (req, res, next) => {
  if (req.session.data) {
    console.log(req.session.data);
    next();
  } else {
    res.redirect("/admin/admin");
  }
};

const {
    couponDetail,
    addcoupon,
    addcouponpost,
    checkCouponCode,
  } = require("../controllers/coupenController");

router.get('/coupons',checkSession,couponDetail)  
router.get('/addcoupon',checkSession,addcoupon)
router.post('/addcoupon',checkSession,addcouponpost)
router.post('/checkcoupon', checkCouponCode);


module.exports = router; 