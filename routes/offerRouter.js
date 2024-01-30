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
  offer,
  productoffer,
  categoryoffer,
  catoffer,
  addprdoffer,
} = require("../controllers/offerController");

router.get('/offers',offer)
router.get('/addprdoffer',productoffer)
router.get('/addcatoffer',categoryoffer)
router.post('/createcatOffer',catoffer)
router.post('/createProductOffer',addprdoffer)


module.exports = router;