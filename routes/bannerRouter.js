const express = require("express");
const router = express();
const path = require("path");
const session = require("express-session");
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
    cb(null, 'public/banner')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})
const upload = multer({ storage: storage }) 

router.use(express.static(path.join(__dirname, "uploads")));

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
    bannermang,
    addbanner,
    postBanner
} = require("../controllers/bannerController");


router.get('/banner',bannermang)
router.get('/addbanner',addbanner)
router.post('/addbanner', upload.single('img'),postBanner)

module.exports = router;