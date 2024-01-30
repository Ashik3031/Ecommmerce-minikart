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
const order = require('../model/order')
const wallet =require('../model/wallet')
const PDFDocument = require("pdfkit");
const { log, Console } = require("console");

router.use(nocache());
router.use(bodyParser.urlencoded({ extended: true  }));
router.use(bodyParser.json());

router.use(
  session({
    secret: "secret key",
    resave: false,
    saveUninitialized: true,
  })
);



exports.userprofile = async (req, res) => {
    try {
      const userId = req.session.user; 
      const user = await usercollection.findOne({ _id: userId });
      const categoery = await catcollection.find();
      const profileModels= userProfile.findOne({userid: userId });
      const addressData = await Address.findOne({ userId: userId});
  
      res.render('userprofile', { user,categoery,profileModels,addressData });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };
  

exports.changepass = async(req,res)=>{
    const userId = req.session.user; 
    const user = await usercollection.findOne({ _id: userId });
    const categoery = await catcollection.find();
    res.render('changepassword',{user,categoery})
  }
  
  
  exports.pchangepass = async (req, res) => {
    const userId = req.session.user;
    const user = await usercollection.findOne({ _id: userId });
  
    if (!user) {
      console.log("No user found");
      res.redirect('/login'); // Redirect to login or handle the error appropriately
    } else {
      const oldPassword = req.body.oldPassword;
      const newPassword = req.body.newPassword;
      const confirmPassword = req.body.confirmPassword;
  
      // Check if the old password matches the current password
      if (oldPassword !== user.password) {
        console.log("Old password is incorrect");
        res.redirect('/changepass'); // Redirect with an error message or handle it appropriately
      } else {
        // Update the password
        await usercollection.updateOne(
          { _id: userId },
          { $set: { password: newPassword } }
        );
        res.redirect('/userprofile');
      }
    }
  };
  
  
  exports.wallet = async(req,res)=>{
    const userId = req.session.user; 
    const user = await usercollection.findOne({ _id: userId });
    const categoery = await catcollection.find();
    let mail=user.email
    const wallett = await wallet.find({Email:mail})
    res.render('wallet',{categoery,user,wallett})
  }
  
  exports.addaddress = async(req,res)=>{
    res.render('addadress')
  }
  
  
  
  exports.uploads = async (req, res) => {
    // Check if a file was uploaded
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }
    try {
      console.log('heelooo');
      const userId = req.session.user; 
      console.log('sdfghjk',userId);
      // Assuming `userProfile` is your Mongoose model
      let user = await userProfile.findOne({ userid: userId });
      console.log(user);
      if (!user) {
        console.log("inside");
        // If the user does not exist, create a new user profile
        user1 = new userProfile({
          userid: userId,
          image: '/uploads/' + req.file.filename,
        });
  
        await user1.save();
      } else {
        // If the user exists, update the image path
        user.image = '/uploads/' + req.file.filename;
        await user.save();
      }
  
      res.redirect('/userprofile');
    } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    }
  };
  
  
  
  

  //address
  
  exports.address = (req,res)=>{
    res.render('addaddress')
  }
  
  
  exports.addAddress = async (req, res) => {
    try {
      // Extract values from the form submission
      const { firstName, lastName, address, city, state, pincode } = req.body;
  
      // Assuming you have the user ID stored in the session or request
      const userId = req.session.user; // Update this according to your user ID implementation
  
      // Create a new address instance
      const newAddress = new Address({
        userId,
        firstname: firstName, 
        lastname: lastName,   
        address,
        city,
        state,
        pincode,
      });
      console.log(newAddress)
      
      await newAddress.save();

      res.redirect('/userprofile'); 
    } catch (error) {
      console.error('Error adding address:', error);
      res.status(500).send('Internal Server Error');
    }
  };
  

  exports.getaddressdetail = async(req,res)=>{
    const userId = req.session.user;
    const address = await Address.find({userId:userId})
    const user = await usercollection.find({_id:userId})
    const categoery = await catcollection.find();
    res.render('addressdetail',{address,categoery,user})
  }

  exports.geteditaddres = async(req,res)=>{
    const userId = req.session.user;
    const id = req.params.addresid
    const address = await Address.findOne({_id:id})
    console.log("gettt",address);
    const user = await usercollection.find({_id:userId})
    const categoery = await catcollection.find();
    res.render('editaddress',{address,categoery,user})
  }

  exports.postAddressEdit= async (req, res) => {
    try {
      console.log("ppppppppppppp",req.params.addresid) 
      await Address.updateOne(
        { _id: req.params.addresid },
        {
          $set: {
            firstname: req.body.editFirstName,
            lastname: req.body.editLastName,
            address: req.body.editAddress,
            city: req.body.editCity,
            state: req.body.editState,
            pincode: req.body.editPincode
          },
        }
      );
      res.redirect("/addressdetail");
    } catch (err) {
      console.log("Error updating address: ", err);
    }
  }

  exports.getAddressDelete = async (req, res) => {
    const addressId = req.params.addresid;
  
    try {
      // Check if addressId is undefined before attempting to delete
      if (addressId) {
        await Address.findByIdAndDelete(addressId);
        console.log("Address deleted successfully.");
      } else {
        console.log("AddressId is undefined.");
      }
    } catch (err) {
      console.log("Error deleting the address: ", err);
    }
  
    res.redirect("/addressdetail");
  }
  
  
   exports.editprofile = async (req,res)=>{
    const userId = req.session.user;
    const user = await usercollection.findOne({ _id: userId });
    console.log('user0000',user)
    res.render('editprofile',{user}) 
   }

   exports.updateProfile = async (req, res) => {
    const userId = req.session.user; // Assuming you are passing the user ID in the route
  
    try {
      // Find the user by ID
      const userId = req.session.user; 
      const user = await usercollection.findOne({ _id: userId });
      if (!user) {
        return res.status(404).send('User not found');
      }
  
      console.log('pppppppppo',req.body);
      // Update the username based on the form data
      user.username = req.body.username;
      console.log("lool",user.username);
      // Save the updated user information
      await user.save();
  
      console.log('Username updated successfully.');
  
      // Redirect to a profile page or any other appropriate route
      res.redirect('/userprofile');
    } catch (err) {
      console.error('Error updating username:', err);
      res.status(500).send('Internal Server Error');
    }
  };
  
  //  exports.order= async (req,res)=>{
  //   const userId = req.session.user; 
  //   const user = await usercollection.findOne({ _id: userId });
  //   const categoery = await catcollection.find();
  //   const orders = await order.find()
  //   res.render('order',{ orders ,user,categoery})
  // }

  
  exports.order = async (req, res) => {
    const userId = req.session.user;
    const user = await usercollection.findOne({ _id: userId });
  
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = 4;
    const skip = (page - 1) * limit;
  
    // Fetch orders with pagination
    const orders = await order.find({userId:userId}).skip(skip).limit(limit).exec();
  
    // Count total number of orders for pagination
    const totalOrders = await order.countDocuments();
  
    const categoery = await catcollection.find();
    // Calculate total number of pages
    const totalPages = Math.ceil(totalOrders / limit);
  
    // Pass pagination details to the view
    res.render('order', { orders, user, totalPages, currentPage: page, categoery });
  };
  

   

  
  // exports.orderdetail = async (req, res) => {
  //   try {
  //     const orderId = req.params.orderId;
  //     const foundOrder = await OrderDb.findById(orderId);
  
  //     if (!foundOrder) {
  //       // Handle case where order is not found
  //       return res.status(404).send('Order not found');
  //     }
  
  //     res.render('orderdetail', { order: foundOrder });
  //   } catch (error) {
  //     // Handle errors
  //     console.error(error);
  //     res.status(500).send('Internal Server Error');
  //   }
  // };  
  
  exports.orderdetail = async (req, res) => {
    try {
      const userId = req.session.user;
      const orderId = req.params.order_id;  // Corrected to use req.params.order_id
      const productid = req.params.productid;
      console.log(productid)
      // Find the order containing the specified product 
      const Order = await OrderDb.findOne({ _id: orderId });
      //const foundOrder = await OrderDb.findOne({ 'products.productid': productid });
      const productDetails = await productcollection.findOne({_id: productid})
      
      if (!productDetails) {
        // Handle case where order is not found
        return res.status(404).send('Order not found for the specified product');
      }
      // Filter the products to get details for the specified product
      //const productDetails = foundOrder.products.find(products => products.productid === productid);
     console.log('oooo',productDetails)
      res.render('orderdetail', { order: productDetails , orders: Order  });
    } catch (error) {
      // Handle errors 
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
};


exports.generateInvoice = async (req, res) => {
  try {  
    let userId = req.session.user;
    console.log(userId);
    const orderId = req.params.order_id;
    console.log("Entered",orderId);

    const invoiceDetails = await usercollection.findOne({ _id: userId });
    console.log("Invoice", invoiceDetails);

    const specificOrder = await OrderDb.findById(orderId).populate("products");
    console.log("Invoice", specificOrder);




    // Create a new PDF document
    const doc = new PDFDocument();

    // Set response headers to trigger a download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="invoice.pdf"');
    // Pipe the PDF document to the response
    doc.pipe(res);
  
    // const imagePath = "public/img/logo.png"; // Change this to the path of your image
    // const imageWidth = 100; // Adjust image width based on your layout
    // const imageX = 550 - imageWidth; // Adjust X-coordinate based on your layout
    // const imageY = 50; // Adjust Y-coordinate to place the image at the top
    // doc.image(imagePath, imageX, imageY, { width: imageWidth });

    // Move to the next section after the image
    doc.moveDown(1);
    // Add content to the PDF document
    doc.fontSize(16).text("Billing Details", { align: "center" });
    doc.moveDown(1.2);
    doc.fontSize(10).text("Customer Details", { align: "center" });
    doc.moveDown(1);
    doc.text(`Order ID: ${orderId}`);

    doc.moveDown(0.3);
    doc.text(`Name: ${invoiceDetails.username || ""}`);
    doc.moveDown(0.3);
    doc.text(`Email: ${invoiceDetails.email || ""}`);
    
    

    doc.moveDown(0.3);
    const address = specificOrder.address;
    doc.text(
      `Address: ${address.address}, ${address.city}, ${address.state} ${
        address.pincode || ""
      }`
    );
    doc.moveDown(0.3);
    doc.text(`Payment Method: ${specificOrder.paymentMethod || ""}`);

    doc.moveDown(0.3);
    console.log("In");
    const headerY = 300; // Adjust this value based on your layout
    doc.font("Helvetica-Bold");
    doc.text("Name", 100, headerY, { width: 150, lineGap: 5 });
    doc.text("Status", 300, headerY, { width: 150, lineGap: 5 });
    doc.text("Quantity", 400, headerY, { width: 50, lineGap: 5 });
    doc.text("Price", 500, headerY, { width: 50, lineGap: 5 });
    doc.font("Helvetica");

    // Table rows
    const contentStartY = headerY + 30; // Adjust this value based on your layout
    let currentY = contentStartY;
    specificOrder.products.forEach((product, index) => {
      doc.text(product.product || "", 100, currentY, {
        width: 150,
        lineGap: 5,
      });

      doc.text(product.status || "", 300, currentY, {
        width: 50,
        lineGap: 5,
      });
      doc.text(product.quantity || "", 400, currentY, {
        width: 50,
        lineGap: 5,
      });

      doc.text(product.price || "", 500, currentY, {
        width: 50,
        lineGap: 5,
      });
      console.log("Reached Here");

      // Calculate the height of the current row and add some padding
      const lineHeight = Math.max(
        doc.heightOfString(product.product || "", { width: 150 }),
        doc.heightOfString(product.status || "", { width: 150 }),
        doc.heightOfString(specificOrder.totalQuantity[index] || "", {
          width: 50,
        }),
        doc.heightOfString(product.price || "", { width: 50 })
      );
      currentY += lineHeight + 10; // Adjust this value based on your layout
    });
    doc.text(`Total Price: ${specificOrder.totalPrice || ""}`, {
      width: 400, // Adjust the width based on your layout
      lineGap: 5,
    });

    // Set the y-coordinate for the "Thank you" section
    const separation = 50; // Adjust this value based on your layout
    const thankYouStartY = currentY + separation; // Update this line

    // Move to the next section
    doc.y = thankYouStartY; // Change this line

    // Move the text content in the x-axis
    const textX = 60;
      const textWidth = 500;
      doc.fontSize(14).text(
        "Thank you for choosing E-Cart! We appreciate your support and are excited to have you as part of our family.",
        textX,
        doc.y,
        { align: "center", width: textWidth, lineGap: 10 }
      );

    doc.end();
  } catch (error) {
    res.render("error");
  }
};