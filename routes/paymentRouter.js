const express = require("express");
const router = express();
// const usercontroller=require('../controllers/usercontroller')
const session = require("express-session");
const usercollection = require("../model/account");
const orderController = require('../model/order');
const path = require("path");
// const multer = require("multer");
const { 
    razorPayment,
} = require("../controllers/paymentController"); 

router.use(
  session({
    secret: "secret key",
    resave: false,
    saveUninitialized: true,
  })
);


require("dotenv").config();


const checkSessionAndBlocked = async (req, res, next) => {
  if (req.session.user) {
    const userDetials = await usercollection.findOne({ _id: req.session.user });
    if (!userDetials.status) {
      // User is not blocked, proceed to the next middleware or route handler
      next();
    } else {
      // User is blocked, destroy the session and redirect
      req.session.destroy((err) => {
        if (err) {
          console.log("Error destroying session: ", err);
          res.redirect("/");
        } else {
          res.redirect("/");
        }
      });
    }
  } else {
    // No userId in session, redirect to the default page
    res.redirect("/");
  }
};

require("dotenv").config();



router.post('/create/orderId',razorPayment)

module.exports = router;