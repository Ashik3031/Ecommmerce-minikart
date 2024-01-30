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
const upload = multer({ storage: storage }).array("images", 4);


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
  adminlogin,
  padminlogin,
  usermanagement,
  dashboard,
  categoery,
  addcategory,
  editpage,
  editcategory,
  product,
  deletecategory,
  edituser,
  updateuser,
  block,
  logout,
  addproduct,
  addproductpost,
  deleteproduct,
  editprd,
  editproduct,
  list,
  cart,
  ordermang,
  updatestatus,
  removeImage,
  salesreport,
  excelReport,
  salesPdf,
  bannermang,
  addbanner,
  postBanner
} = require("../controllers/adminController");

router.get("/admin", adminlogin);
router.post("/adminlog", padminlogin);
router.get("/usermangement", checkSession, usermanagement);
router.get("/admindashboard", checkSession, dashboard);
router.get("/cat-mng", checkSession, categoery);
router.post("/add-cat", checkSession, addcategory);
router.get("/edit-cat/:id", checkSession, editpage);
router.post("/edit-cat/:id", editcategory);
router.get("/delete-cat/:id", checkSession, deletecategory);
router.get("/edit-user/:id", checkSession, edituser);
router.post("/edit-user/:id", updateuser);
router.get("/product-mng", checkSession, product);  
router.get("/blockuser/:id", checkSession, block);
router.get("/logout", logout); 
router.get("/addproduct", checkSession, addproduct);
router.post("/addproducts/add", upload, addproductpost);
router.get("/delete-prd/:id", checkSession, deleteproduct);
router.get("/edit-prd/:id", checkSession, editprd);
router.post("/edit-prd/:id", upload, editproduct);
router.post('/remove-image/:id',removeImage);
router.get("/list/:id", upload, list);
router.get('/cart',checkSession,cart);
router.get('/ordersmang',checkSession,ordermang);
router.post('/updateStatus/:id',checkSession,updatestatus);
router.get('/salesreport',checkSession,salesreport)
router.get('/excelReport',excelReport)
router.get('/salesgeneratepdf',salesPdf)


module.exports = router;