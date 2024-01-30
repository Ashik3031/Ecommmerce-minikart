const express = require("express");
const nocache = require("nocache");
const path = require("path");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const router = express.Router();
const mongoose = require("mongoose");
const session = require("express-session");
//const files = require('../public/uploads');
const usercollection = require("../model/account");
const CatCollection = require("../model/category");
const productcollection = require("../model/product");
const orderdb = require('../model/order')
const banner =require('../model/banner')
const { log } = require("console");
const multer = require("multer");
const PDFDocument = require("pdfkit-table");
const ExcelJS = require("exceljs");

require("dotenv").config();

router.use(
  session({
    secret: "secret key",
    resave: false,
    saveUninitialized: true,
  })
);

router.use(nocache());
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

exports.adminlogin = (req, res) => {
  if (req.session.data) {
    res.redirect("/admin/admindashboard");
  } else {
    console.log(req.session.data);

    res.render("adminlogin",{message:""});
  }
};

exports.padminlogin = async (req, res) => {
    try {
      const admin = {
        username: "admin",
        password: "admin123",
      };
  
      console.log(req.body);
  
      if (
        req.body.username === admin.username &&
        req.body.password === admin.password
      ) {
        console.log(req.body);
        req.session.data = admin.username;
        res.redirect("/admin/admindashboard");
      } else {
        // Render the admin login page with an error message
        res.render("adminlogin", {
          message: "Enter correct email and password",
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  };
  

exports.dashboard = async (req, res) => {
  try {
    // Daily Orders
    const dailyOrders = await orderdb.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$orderDate" } },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const { dates, orderCounts, totalOrderCount } = dailyOrders.reduce(
      (result, order) => {
        result.dates.push(order._id);
        result.orderCounts.push(order.orderCount);
        result.totalOrderCount += order.orderCount;
        return result;
      },
      { dates: [], orderCounts: [], totalOrderCount: 0 }
    );
    // monthly
    const monthlyOrders = await orderdb.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$orderDate" },
            month: { $month: "$orderDate" },
          },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);
    const monthlyData = monthlyOrders.reduce((result, order) => {
      const monthYearString = `${order._id.year}-${String(
        order._id.month
      ).padStart(2, "0")}`;
      result.push({
        month: monthYearString,
        orderCount: order.orderCount,
      });
      return result;
    }, []);
    let monthdata = orderCounts;

    //  Yearly Order
    const yearlyOrders = await orderdb.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y", date: "$orderDate" } },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const { years, orderCounts3, totalOrderCount3 } = yearlyOrders.reduce(
      (result, order) => {
        result.years.push(order._id);
        result.orderCounts3.push(order.orderCount);
        result.totalOrderCount3 += order.orderCount;
        return result;
      },
      { years: [], orderCounts3: [], totalOrderCount3: 0 }
    );

    res.render("admindashboard", {
      dates,
      orderCounts,
      totalOrderCount,
      monthdata,
      years,
      orderCounts3,
      totalOrderCount3,
    });
  } catch (error) {
    console.error("Error fetching and aggregating orders:", error);
    res.status(500).send("Internal Server Error");
  }
};


const PAGE_SIZE = 5; // Number of categories to display per page

exports.categoery = async (req, res) => {
  try {
    const page = req.query.page || 1; 
    const skip = (page - 1) * PAGE_SIZE; 

   const categories = await CatCollection.find().skip(skip).limit(PAGE_SIZE);

    const totalCategories = await CatCollection.countDocuments();

    const totalPages = Math.ceil(totalCategories / PAGE_SIZE);

    
    res.render("categorymang", { categories, message: "", currentPage: page ,totalPages});
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};


exports.usermanagement = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 6; 
  const skip = (page - 1) * limit;

  try {
    const totalUsers = await usercollection.countDocuments();
    const totalPages = Math.ceil(totalUsers / limit);

    const users = await usercollection.find().skip(skip).limit(limit).exec();

    res.render("usermanagement", { users, totalPages, currentPage: page });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).send("Internal Server Error");
  }
};


exports.addcategory = async (req, res) => {
  const { Name } = req.body;
  try {
    // Check if the category already exists
    const existingCategory = await CatCollection.findOne({
      $or: [
        { Name: { $regex: new RegExp("^" + Name + "$", "i") } }, // Case-insensitive match
        { Name: { $regex: new RegExp("^" + Name.toUpperCase() + "$") } }, // Match in uppercase
        { Name: { $regex: new RegExp("^" + Name.toLowerCase() + "$") } }, // Match in lowercase
      ],
    });

    if (existingCategory) {
      return res.status(400).send("Category already exists");
    }

    // Create a new category
    const newCategory = new CatCollection({ Name });

    // Save the new category to the database
    await newCategory.save();
    console.log("Redirecting...");
    // Redirect only if the category doesn't exist
    //return  res.redirect("/admin/cat-mng");
    return res.status(200).json({ success: true, redirect: '/admin/cat-mng', message: 'Login successful' });
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal Server Error");
  }
};

exports.editpage = (req, res) => {
  console.log("enter get");
  const id = req.params.id;
  const categoery = CatCollection.findById(id)
    .then((user) => {
      console.log("enter therb");

      if (!user) {
        res.redirect("/admin/cat-mng");
      } else {
        console.log(user);
        res.render("editcategory", { categoery: user });
      }
    })
    .catch((err) => {
      console.error("error");
      res.status(500).send("Internal Server Error");
    });
};

exports.editcategory = async (req, res) => {
  const id = req.params.id;

  try {
    // Find the category by ID
    const category = await CatCollection.findById(id);

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Check if the edited name already exists in the database
    const existingCategory = await CatCollection.findOne({
      _id: { $ne: id }, // Exclude the current category from the check
      Name: { $regex: new RegExp("^" + req.body.categoryName + "$", "i") },
    });

    if (existingCategory) {
      return res.status(400).json({ error: "Category name already exists" });
    }

    // Update the category with the new data
    category.Name = req.body.categoryName;

    // Save the updated category
    const updatedCategory = await category.save();
    // res.redirect("/admin/cat-mng");
    return res.status(200).json({ success: true, redirect: '/admin/cat-mng', message: 'Login successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


exports.deletecategory = async (req, res) => {
  try {
    console.log("enter");
    const id = req.params.id;
    console.log(id);
    await CatCollection.findByIdAndDelete(id).then((x) => {
      console.log("enter the delete if", x);

      res.redirect("/admin/cat-mng");
    });
  } catch {
    res.json({ msg: "user not found" });
  }
};

exports.edituser = async (req, res) => {
  const id = req.params.id;
  const users = await usercollection
    .findById(id)
    .then((users) => {
      //  if(!user){
      //
      //      res.redirect('/admin/cat-mng')
      //  }else{
      //      console.log(user);;
      //
      //  }
      console.log("user is ", users);
      res.render("edituser", { users });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send("Internal Server Error");
    });
};

exports.updateuser = async (req, res) => {
  const id = req.params.id;
  console.log("hayyyy");
  try {
    const user = await usercollection.findById(id);

    if (!user) {
      return res.status(404).send("Category not found");
    }

    user.Name = req.body.Name;
    user.email = req.body.email;

    res.redirect("/admin/cat-mng");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};
exports.block = async (req, res) => {
  const userId = req.params.id;
  const user = await usercollection.findById(userId);
  user.status = !user.status;
  await user.save();
  const userList = await usercollection.find();
  console.log(userList);
  // res.render('dashboard', { users: userList, message: "User status updated" });
  res.redirect("/admin/usermangement");
};

exports.product = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 6; // Adjust the number of products per page as needed
  const skip = (page - 1) * limit;

  try {
    const totalProducts = await productcollection.countDocuments();
    const totalPages = Math.ceil(totalProducts / limit);

    const product = await productcollection
      .find({})
      .populate('category')
      .skip(skip)
      .limit(limit)
      .exec();

    res.render("productmang", { product, totalPages, currentPage: page, message: "" });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).send("Internal Server Error");
  }
};


exports.logout = (req, res) => {
  req.session.destroy();
  res.redirect("/admin/admin");
};

exports.addproduct = async (req, res) => {
  const categories = await CatCollection.find();
  res.render("addproduct", { categories });
};

exports.addproductpost = async (req, res) => {
  console.log(req.body);
  // if (req.session.admin) {
  const data = {
    productName: req.body.productName,
    category: req.body.category,
    price: req.body.price,
    stock:req.body.stock,
    rating: req.body.rating,
    model: req.body.model,
    description: req.body.description,
    images: req.files.map((file) => file.path.substring(6)),
  };

  // Check if product with the same name already exists
  const existingProduct = await productcollection.findOne({
    productName: data.productName,
  });

  if (existingProduct) {
    const cat = await CatCollection.find();
    // console.log('Product with the same name already exists');
    res.render("productmang", {
      categories: cat,
      message: "Product with the same name already exists",
    });
    return;
  } else {
    // console.log(req.files);
    // console.log(data);
    await productcollection.insertMany([data]).then((x) => {
      console.log("inserted");
      res.redirect("/admin/product-mng");
    });
  }

  // } else {
  //   res.redirect('/admin/adminlogin', 302);
  // }
};

exports.deleteproduct = async (req, res) => {
  try {
    console.log("enter");
    const id = req.params.id;
    console.log(id);
    await productcollection.findByIdAndDelete(id).then((x) => {
      console.log("enter the delete if", x);

      res.redirect("/admin/product-mng");
    });
  } catch {
    res.json({ msg: "user not found" });
  }
};

exports.editprd = async (req, res) => {
  const id = req.params.id;
  const product = await productcollection.findById(id);
  const categories = await CatCollection.find();
  res.render("editproduct", { product, categories });
};

exports.editproduct = async (req, res) => {
  console.log("enter");
  const id = req.params.id;
  try {
    // Find the category by ID
    const product = await productcollection.findOne({ _id: id });
    console.log("prd", product);
    if (!product) {
      return res.status(404).send("product not found");
    } else {

      // Check if req.files is provided (new images)
      let updatedImages;
      if (req.files && req.files.length > 0) {
        updatedImages = req.files.map((file) => file.path.substring(6));
      } else {
        // If no new images provided, use the existing images
        updatedImages = product.images;
      }

      // Update the product with the new data
      const data = {
        productName: req.body.productName,
        category: req.body.category,
        price: req.body.price,
        stock:req.body.stock,
        rating: req.body.rating,
        model: req.body.model,
        description: req.body.description,
        images: updatedImages,
      }
      console.log("data is", data);
      await productcollection.findByIdAndUpdate(id, data);
      console.log("updated");
      res.redirect("/admin/product-mng");
      }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

// productController.js
const Product = require('../model/product');

exports.removeImage = async (req, res) => {
  const productId = req.params.id;
  const { imageName } = req.body;

  try {
    // Find the product by ID
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).send('Product not found');
    }

    // Remove the specified image from the product's images array
    const updatedImages = product.images.filter(image => image !== imageName);

    // Update the product with the new images array
    await Product.findByIdAndUpdate(productId, { images: updatedImages });

    res.status(200).send('Image removed successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};



exports.list = async (req, res) => {
  const prdId = req.params.id;
  const prd = await productcollection.findById(prdId);
  prd.status = !prd.status;
  await prd.save();
  const userList = await usercollection.find();
  console.log(userList);
  res.redirect("/admin/product-mng");
};


exports.cart = (req,res)=>{
  res.render('cart')
}

exports.ordermang = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 5; // Adjust the number of orders per page as needed
  const skip = (page - 1) * limit;

  try {
    const totalOrders = await orderdb.countDocuments();
    const totalPages = Math.ceil(totalOrders / limit);

    const orders = await orderdb.find().skip(skip).limit(limit).exec();

    res.render("ordermang", { orders, totalPages, currentPage: page });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).send("Internal Server Error");
  }
};


exports.updatestatus = async(req,res)=>{
    const orderId = req.params.id; 
    const { statusAction } = req.body;
   
    try {
        // Find the order by ID and update the status
        console.log("aaaaaaa")
        const updatedOrder = await orderdb.findByIdAndUpdate(orderId, { 'products.$[].status': statusAction }, { new: true });
        
        if (!updatedOrder) {
            return res.status(404).send('Order not found');
        }

        res.redirect('/admin/ordersmang'); // Redirect to the order management page after updating
    } catch (error) {
      console.log("aaaaabb")
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
  }

  exports.salesreport = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 6; 
    const skip = (page - 1) * limit;
  
    try {
      const totalOrders = await orderdb.countDocuments();
      const totalPages = Math.ceil(totalOrders / limit);
  
      const orders = await orderdb.find().skip(skip).limit(limit).exec();
  
      res.render("salesreport", { orders, totalPages, currentPage: page });
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).send("Internal Server Error");
    }
  };
  

  exports.excelReport = async (req, res) => {
    try {
      console.log("Excel");
  
      const startdate = new Date(req.query.startingdate);
      const Endingdate = new Date(req.query.endingdate);
      console.log(startdate);
      console.log(Endingdate);
      Endingdate.setDate(Endingdate.getDate() + 1);
  
      const orderCursor = await orderdb.aggregate([
        {
          $match: {
            orderDate: { $gte: startdate, $lte: Endingdate },
          },
        },
      ]);
      console.log(orderCursor);
      if (orderCursor.length === 0) {
        return res.redirect("/admindashboard");
      }
  
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Sheet 1");
  
      // Add data to the worksheet
      worksheet.columns = [
        { header: "Username", key: "username", width: 15 },
        { header: "Product Name", key: "productname", width: 20 },
        { header: "Quantity", key: "quantity", width: 15 },
        { header: "Price", key: "price", width: 15 },
        { header: "Status", key: "status", width: 15 },
        { header: "Order Date", key: "orderdate", width: 18 },
        { header: "Address", key: "address", width: 30 },
        { header: "City", key: "city", width: 20 },
        { header: "Pincode", key: "pincode", width: 15 },
        { header: "State", key: "state", width: 15 },
      ];
  
      for (const orderItem of orderCursor) {
        // Fetch address details based on the address ID
  
        worksheet.addRow({
          username: orderItem.username,
          productname: orderItem.products
            .map((product) => product.product)
            .join(", "),
          quantity: orderItem.totalQuantity,
          price: orderItem.totalPrice,
          status: orderItem.products.map((product) => product.status).join(", "),
          orderdate: orderItem.orderDate,
          address: orderItem.address.address,
          city: orderItem.address.city,
          pincode: orderItem.address.pincode,
          state: orderItem.address.state,
        });
      }
  
      // Generate the Excel file and send it as a response
      workbook.xlsx.writeBuffer().then((buffer) => {
        const excelBuffer = Buffer.from(buffer);
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader("Content-Disposition", "attachment; filename=excel.xlsx");
        res.send(excelBuffer);
      });
    } catch (error) {
      console.error("Error creating or sending Excel file:", error);
      res.status(500).send("Internal Server Error");
    }
  };

  exports.salesPdf = async (req, res) => {
    try {
      const startingDate = new Date(req.query.startingdate);
      const endingDate = new Date(req.query.endingdate);
  
      // Fetch orders within the specified date range
      const orders = await orderdb.find({
        orderDate: { $gte: startingDate, $lte: endingDate },
      });
  
      // Create a PDF document
      const doc = new PDFDocument();
      const filename = "sales_report.pdf";
  
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Type", "application/pdf");
  
      doc.pipe(res);
  
      // Add content to the PDF document
      doc.text("Sales Report", { align: "center", fontSize: 10, margin: 2 });
  
      // Define the table data
      const tableData = {
        headers: [
          "Username",
          "Product Name",
          "Price",
          "Quantity",
          "Address",
          "City",
          "Pincode",
          "State",
        ],
        rows: orders.map((order) => [
          order.username,
          order.products.map((product) => product.product).join(", "),
          order.products.map((product) => product.price).join(", "),
          order.products.map((product) => product.quantity).join(", "),
          order.address.address,
          order.address.city,
          order.address.pincode,
          order.address.state,
        ]),
      };
  
      // Draw the table
      await doc.table(tableData, {
        prepareHeader: () => doc.font("Helvetica-Bold"),
        prepareRow: () => doc.font("Helvetica"),
      });
  
      // Finalize the PDF document
      doc.end();
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).send("Internal Server Error");
    }
  };
  

  