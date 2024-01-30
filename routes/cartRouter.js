const express = require("express");
const router = express();
// const usercontroller=require('../controllers/usercontroller')
const session = require("express-session");
const usercollection = require("../model/account");
const orderController = require('../model/order');
const path = require("path");
const multer = require("multer");

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
const {
 
  cart,
  checkout,
  addTocart,
  removeProduct,
  incqunty,
  porder,
  cancelOrder,
  returnOrder,
  applyCoupon,
  checkaddress,
  checkaddAddress,
  inccart,
  deccart
} = require("../controllers/cartController"); 
 

router.get("/cart/:user_id",checkSessionAndBlocked, cart);
router.get("/addtocart/:product_id/:user_id",checkSessionAndBlocked, addTocart);
router.get('/removeprd/:cartItemId',removeProduct);
router.put('/updateQuantity/:cartItemId/:newQuantity',incqunty);
router.post('/placeorder',porder)
//router.get('/confirmorder',confirm)
router.post('/ordersdlt/:productid/:order_id', cancelOrder);
router.get('/chekout',checkSessionAndBlocked,checkout)
router.post('/returnorder/:productid/:order_id', returnOrder);
router.post('/applycoupon',applyCoupon)
router.get('/checkaddress',checkSessionAndBlocked,checkaddress)
router.post('/checkaddAddress',checkaddAddress)

router.post('/increaseq/:id', checkSessionAndBlocked,inccart)
//decrease cart quantity
router.post('/decreaseq/:id',checkSessionAndBlocked,deccart)

module.exports = router;