const express = require("express");
const nocache = require("nocache");
const path = require("path");
const bodyParser = require('body-parser')
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const router = express.Router();
const mongoose = require("mongoose");
const session = require("express-session");
//const files = require('../public/uploads');
const usercollection = require("../model/account");
const CatCollection = require("../model/category");
const productcollection = require("../model/product");
const offerCollection = require('../model/productoffer')
const orderdb = require('../model/order')
const { log } = require("console");
const catcollection = require("../model/category");


require("dotenv").config();

router.use(
  session({
    secret: "secret key",
    resave: false,
    saveUninitialized: true,
  })
);

router.use(nocache());

router.use(bodyParser.urlencoded({ extended: true }))

//router.use(bodyParser.json());


exports.offer = async (req, res) => {
    try {
        const offers = await offerCollection.find();
        res.render('productoffer', { offers });
    } catch (error) {
        // Handle error appropriately (e.g., send an error response)
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};


exports.addoffer = async (req, res) => {
    try {
        const products = await productcollection.find(); 
        const categories = await catcollection.find()
        res.render('addprdoffer', { products,categories });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};


exports.productoffer = async(req,res)=>{
    const product = await productcollection.find()
    res.render('addprdoffer',{product})
}

exports.categoryoffer = async(req,res)=>{
    const categories = await catcollection.find()
    res.render('addcatoffer',{categories})
}

// router.post('/createOffer', async (req, res) => {
//     try {
//       // Extract values from the form submission
//       const { type, code, discount, startDate, endDate, isActive, category } = req.body;
  
//       // Create a new offer instance
//       const newOffer = new Offer({
//         type,
//         code,
//         discount,
//         startDate,
//         endDate,
//         isActive,
//         applicableCategories: [category], // Assuming only one category is selected. If multiple, change accordingly
//       });
  
//       // Save the offer to the database
//       const savedOffer = await newOffer.save();
  
//       // Redirect to a success page or send a success response
//       res.status(201).send(`Offer with ID ${savedOffer._id} created successfully`);
//     } catch (error) {
//       // Handle any errors that occur during the process
//       console.error('Error creating offer:', error);
//       res.status(500).send('Internal Server Error');
//     }
//   });


// exports.createOffer = async (req, res) => {
//     try {
       
//         console.log(req.body)
//         const {
//             type,
//             code,
//             discount,
//             startDate,
//             endDate,
//             isActive,
//             selectedProducts,
//             selectedCategories,
//           } = req.body;


//     // Now you can use selectedProductsArray and selectedCategoriesArray as arrays
//     console.log('Selected Products:', selectedProducts );
//     console.log('Selected Categories:', selectedCategories);
//         // Check if any selected product already has an offer
//         const existingProductOffer = await offerCollection.findOne({
//             applicableProducts: { $in: selectedProducts },
//             startDate: { $lte: endDate },
//             endDate: { $gte: startDate },
//         });

//         if (existingProductOffer) {
//             return res.status(400).json({ error: 'Selected product already has an offer during this period' });
//         }

//         // Check if any selected category already has an offer
//         const existingCategoryOffer = await offerCollection.findOne({
//             applicableCategories: { $in: selectedCategories },
//             startDate: { $lte: endDate },
//             endDate: { $gte: startDate },
//         });

//         if (existingCategoryOffer) {
//             return res.status(400).json({ error: 'Selected category already has an offer during this period' });
//         }

//         const newOffer = new offerCollection({
//             type,
//             code,
//             discount,
//             startDate,
//             endDate,
//             isActive,
//             applicableProducts: selectedProducts,
//             applicableCategories: selectedCategories,
//         });

//         const savedOffer = await newOffer.save();
//         res.redirect('/offers');
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// };


exports.catoffer= async (req, res) => {
    try {
      // Extract values from the form submission
      const { type, code, discount, startDate, endDate, isActive, category } = req.body;
  
      const newOffer = new offerCollection({
        type,
        code,
        discount,
        startDate,
        endDate,
        isActive,
        applicableCategories: [category], 
      });
  
      const savedOffer = await newOffer.save();
      

      res.redirect('/offers')
     
    } catch (error) {
      console.error('Error creating offer:', error);
      res.status(500).send('Internal Server Error');
    }
  }

  exports.addprdoffer = async (req, res) => {
    try {
      const { type, code, discount, startDate, endDate, isActive, product } = req.body;
  
      // Create a new product offer
      const newProductOffer = new offerCollection({
        type,
        code,
        discount,
        startDate,
        endDate,
        isActive,
        applicableProducts: [product],
      });
  
      // Save the new product offer
      const savedProductOffer = await newProductOffer.save();
  
      // Find the corresponding product and update its offer price
      const existingProduct = await productcollection.findOne( {productName:product});
  
      if (existingProduct) {
        // Calculate the new offer price based on the discount percentage
        const discountedPrice = existingProduct.price - (existingProduct.price * discount) / 100;
  
        // Update the offer price in the product
        existingProduct.offerprice = discountedPrice;
  
        // Save the updated product
        await existingProduct.save();
      } else {
        console.error('Product not found for updating offer price');
        // Handle the case where the product is not found
      }
  
      res.redirect('/offers');
    } catch (error) {
      console.error('Error creating product offer:', error);
      res.status(500).send('Internal Server Error');
    }
  };