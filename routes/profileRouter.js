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

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});
const upload = multer({ storage: storage }).single("photo");



router.use(express.static(path.join(__dirname, "uploads")));

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
  userprofile,
  changepass,
  wallet,
  pchangepass,
  uploads,
  order,
  updateprofile,
  editprofile,
  addAddress,
  address,
  updateProfile,
  orderdetail,
  generateInvoice,
  getaddressdetail,
  geteditaddres,
  postAddressEdit,
  getAddressDelete
} = require("../controllers/profileController"); 


router.get('/userprofile',checkSessionAndBlocked,userprofile)
router.get('/changepass',checkSessionAndBlocked,changepass)
router.get('/wallet',checkSessionAndBlocked,wallet);
router.post('/changepassw',pchangepass);
//router.post('/upload', upload, uploads);
router.get('/orders',checkSessionAndBlocked,order)
// router.get('/updateprofile',updateprofile);
router.get('/editprofile',checkSessionAndBlocked,editprofile)
router.get('/address',address)
router.post('/addaddress',addAddress)
router.post('/updateprofile/:id',updateProfile)
router.get('/orderdetail/:productid/:order_id',orderdetail)
router.get('/generateInvoice/:order_id',generateInvoice)
router.get('/addressdetail',checkSessionAndBlocked,getaddressdetail)
router.get('/editaddress/:addresid',checkSessionAndBlocked,geteditaddres)
router.post('/updateAddress/:addresid',postAddressEdit)
router.get('/deleteaddress/:addresid',getAddressDelete)




module.exports = router;