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
  index,
  home,
  signup,
  login,
  psignup,
  plogin,
  otp,
  otppost,
  logout,
  detail,
  resendotp,
  cart,
  product_list,
  checkout,
  addTocart,
  removeProduct,
  incqunty,
  porder,
  confirm,
  cancelorder,
  categoryfilter,
  getwishlist,
  addtoWishlist,
  removeWishlist,
  search
} = require("../controllers/userController"); 






router.get("/", home);
router.get("/index", checkSessionAndBlocked, index);
router.get("/signup", signup);
router.get("/signup/login", login);
router.post("/signup/signup", psignup);
router.post("/login", plogin);
router.post("/otpv", otppost);
router.get("/otp", otp);
router.get("/user/logout", logout);
router.get("/productDetails/:id", checkSessionAndBlocked, detail);
router.get("/resendotp",resendotp);
router.get('/listproduct',checkSessionAndBlocked,product_list)
router.get('/categoery/:id',checkSessionAndBlocked,categoryfilter)
router.get('/wishlist',checkSessionAndBlocked,getwishlist)
router.get('/addtoWishlist/:productid',addtoWishlist)
router.get('/removewishlist/:id',removeWishlist)
router.get('/search',search)


//router.get('/userprofile',checkSessionAndBlocked,userprofile)
//router.get('/chekout',checkSessionAndBlocked,checkout)
//router.get('/changepass',checkSessionAndBlocked,changepass)
//router.get('/wallet',checkSessionAndBlocked,wallet);
//router.post('/changepassw',pchangepass);
//router.get("/cart/:user_id",checkSessionAndBlocked, cart);
//router.get("/addtocart/:product_id/:user_id",checkSessionAndBlocked, addTocart);
//router.get('/removeprd/:cartItemId',removeProduct);
//router.put('/updateQuantity/:cartItemId/:newQuantity',incqunty);
//router.post('/upload', upload, uploads);
//router.get('/updateprofile',updateprofile);
//router.get('/orders',checkSessionAndBlocked,order)
//router.get('/editprofile',checkSessionAndBlocked,editprofile)
//router.get('/address',address)
//router.post('/addaddress',addAddress)
//router.post('/placeorder',porder)
//router.get('/confirmorder',confirm)
//router.get('/ordersdlt/:productid',cancelorder)
//router.post('/updateprofile/:id',updateProfile)
//router.get('/orderdetail',orderdetail)






module.exports = router;