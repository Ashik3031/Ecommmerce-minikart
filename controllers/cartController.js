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
const order = require('../model/order');
const wishlistdb = require('../model/wishlist')
const wallet = require('../model/wallet')
const coupen =require('../model/coupen')
const { log } = require("console");

router.use(nocache());
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

router.use(
  session({
    secret: "secret key",
    resave: false,
    saveUninitialized: true,
  })
);

exports.cart = async (req, res) => {
    try {
      const users = req.session.user;
      const { user_id } = req.params;
      const userName = users.username;
      console.log(user_id);
      const cartItems = await cartcollection.find({ userid: user_id });
      console.log('aaaaaaaaaaaaaaaaaaa0',cartItems.product);
      // Calculate total price using reduce
      const totalPrice = cartItems.reduce((acc, item) => {
        return acc + item.price * item.quantity;
      }, 0);

      const productIds = cartItems.map(item => item.productid);


      const product = await productcollection.find({_id:cartItems.productid})
 
  
      // Calculate the final total price
      const finalTotalPrice = totalPrice ;

      const discountedTotalPrice = req.session.discountedTotalPrice || null;
  
      const categoery = await cartcollection.find()
      const user = await usercollection.find({_id: user_id})
      res.render("cart", {
        cartItems,
        userName,
        userid: user_id,
        discountedTotalPrice :  discountedTotalPrice || null,
        categoery,
        user,
        product
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  };


  exports.addTocart = async (req, res) => {
    console.log("Entered Cart Get");
    const { product_id, user_id } = req.params;
    // Fetch product details
    const product = await productcollection.findById(product_id);
  
    // Check if product already exists in cart
    const existingProduct = await cartcollection.findOne({
      productid: product_id,
      userid: user_id,
    });
  
    if (existingProduct) {
      // If product exists, increase the quantity and update the total
      console.log("Before increment:", existingProduct.quantity);
      existingProduct.quantity = existingProduct.quantity + 1;
      console.log("After increment:", existingProduct.quantity);
  
      existingProduct.total = existingProduct.quantity * product.price;
      await existingProduct.save();
  
      // return res.json({ total: existingProduct.total.toFixed(2) });
    } else {
      // If product doesn't exist, add a new entry to the cart
      const newProduct = new cartcollection({
        userid: user_id,
        productid: product_id,
        product: product.productName,
        price: getProductPrice(product),
        quantity: 1,
        image: product.image,
      });
      
      await newProduct.save();
    }
    
    //res.redirect(`/cart/${user_id}`);
    // return res.json({ total: newProduct.total.toFixed(2) });
    res.redirect("/listproduct")
  };


  function calculateSubtotal(cartItems) {
    return cartItems.reduce((total, item) => total + item.price, 0);
  }
  
  function calculateTotal(cartItems) {
    const subtotal = calculateSubtotal(cartItems);
    // You can change this based on your actual shipping logic
    return subtotal 
  }
  
  
  const getProductPrice = (product) => {
    return product.offerprice !== undefined ? product.offerprice : product.price;
  };


  exports.incqunty = async (req, res) => {
    try {
      const { cartItemId, newQuantity } = req.params;
      const userId = req.session.user;
      // Fetch the cart item
      const cartItem = await cartcollection.findById(cartItemId);
     // const cartitems = await cartcollection.findById({userid: userId})
  
      // Update quantity and total
      cartItem.quantity = parseInt(newQuantity);
      cartItem.total = cartItem.quantity * cartItem.price;
      // const totalPrice = cartitems.reduce((acc, item) => {
      //   return acc + item.price * item.quantity;
      // }, 0);
   
      // Save the updated cart item
      await cartItem.save();
  
      // Send the updated total back to the client
      res.json({ total: cartItem.total.toFixed(2), quantity: cartItem.quantity });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  };



  
  exports.removeProduct = async (req, res) => {
    try {
      const user_id = req.session.user;
      const { cartItemId } = req.params;
      console.log('cartt', cartItemId);
      
      // Find the cart item by ID and remove it
      const removedProduct = await cartcollection.findByIdAndDelete(cartItemId);
  
      if (removedProduct) {
        res.redirect(`/cart/${user_id}`);
      } else {
        res.json({ msg: "Product not found" });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Internal server error" });
    }
  };

  exports.porder=  async (req, res) => {
    try {
      const generateCustomOrderID = () => {
        const orderIdPrefix = "orderid";
        const digits = "0123456789";
        const randomDigitsLength = 6; // You can adjust the length of the random digits as needed
        let randomDigits = "";
      
        for (let i = 0; i < randomDigitsLength; i++) {
          const randomIndex = crypto.randomInt(0, digits.length);
          randomDigits += digits[randomIndex];
        }
      
        const customOrderID = `${orderIdPrefix}${randomDigits}`;
      
        return customOrderID;
      };
      
      console.log(' here enter the post',req.body);
        const userId = req.session.user;
        const selectedAddressId = req.body.selectedAddress; 
        console.log('address is',req.body.selectedAddress);
        const paymentMethod = req.body.payment;
        const cartItems = await cartcollection.find({ userid: userId });
        const user = await usercollection.findOne({_id : userId})
        console.log('user values',user);
        // Retrieve the selected address based on the address ID
   
        function calculateTotalQuantity(cartItems) {
          let totalQuantity = 0;
          // Iterate through the cart items and sum up the quantities
          cartItems.forEach(item => {
            totalQuantity += item.quantity;
          });
          return totalQuantity;
        }
  
        let products = [];
      
        req.session.orderTotalPrice = calculateTotal(cartItems)
  
        for (const cartItem of cartItems) {
          products.push({
            productid: cartItem.productid,
            product: cartItem.product,
            quantity: cartItem.quantity,
            price: cartItem.price,
            status: "Pending",
            generateorderid:generateCustomOrderID()
          });
        }
  
        let selectedAddress;
        if (selectedAddressId !== 'new') {
        selectedAddress = await Address.findById(selectedAddressId);
        } else {
            // If a new address is selected, retrieve the values from the form
            const { firstname, lastname, address, city, state, pincode } = req.body;
            selectedAddress = { firstname, lastname, address, city, state, pincode };
        }
        
        // You may need to add logic to calculate total quantity and total price based on the cart items
        const totalQuantitys = calculateTotalQuantity(cartItems); // Calculate the total quantity
        
        const totalPrice = cartItems.reduce((acc, item) => {
          return acc + item.price * item.quantity;
        }, 0);
  
        // Create a new order document
        const newOrder = new OrderDb({
          userId,
          username: user.username, 
          products: products,
          totalQuantity:totalQuantitys,
          totalPrice:totalPrice.toFixed(2),
          status:"pending",
          address:{
            address: selectedAddress.address,
            city: selectedAddress.city,
            state: selectedAddress.state,
            pincode: selectedAddress.pincode,
          },
          orderDate: new Date(),
          paymentMethod:paymentMethod,
          deliveryDate: new Date()+10 ,
        });
        

        for (const product of newOrder.products) {
          const productInDB = await productcollection.findById(product.productid);  

          if (productInDB) {
              if (productInDB.stock >= product.quantity) {
                  productInDB.stock -= product.quantity;
                  await productInDB.save();
              } else {
                  console.log(`Insufficient stock for product ${productInDB.productName}`);
              }
          } else {
              console.log(`Product with ID ${product.productid} not found in the database`);
          }
      }

        // Save the new order to the database
        await newOrder.save().then(x=>{
          console.log('insert ',x);
        })
        await cartcollection.deleteMany({userid:userId})
        .then(x=>{
          console.log('deleted cart');
        })
        res.render('orderconfirm',{name:user.username,totalPrice:totalPrice.toFixed(2)}); 
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
  }

  exports.checkout = async (req, res) => {
    console.log('here'); 
    const userId = req.session.user;
    const categoery = await catcollection.find();
    const user = await usercollection.findOne({ _id: userId });
    const cartItems = await cartcollection.find({ userid: userId });
    const addresses = await Address.find({ userId: userId })
    console.log('values',categoery,cartItems,addresses);
    const totalPrice = cartItems.reduce((acc, item) => {
      return acc + item.price * item.quantity;
    }, 0);
    res.render('checkout', { categoery, calculateSubtotal, calculateTotal,cartItems,addresses,user,totalPrice });
  }

  exports.checkaddress = async(req,res) =>{
    const userId = req.session.user; // Update this according to your user ID implementation
      const user = await usercollection.findOne({_id:userId})
    res.render('checkadress',{user})
  }

  exports.checkaddAddress = async (req, res) => {
    try {
      // Extract values from the form submission
      const { firstName, lastName, address, city, state, pincode } = req.body;
  
      // Assuming you have the user ID stored in the session or request
      const userId = req.session.user; // Update this according to your user ID implementation
      const user = await usercollection.findOne({userId:userId})
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

      res.redirect('/chekout'); 
    } catch (error) {
      console.error('Error adding address:', error);
      res.status(500).send('Internal Server Error');
    }
  };
  
  
  

  exports.cancelOrder = async (req, res) => {
    const userId = req.session.user;
    const orderId = req.params.order_id;  // Corrected to use req.params.order_id
    const productid = req.params.productid;
    const user = usercollection.findOne(userId)
    const reason  = req.body.reason;  // Assuming you're sending the reason in the request body
    console.log(orderId, productid, reason);
    try {
      // Find the order and update the product status and reason
      const order = await OrderDb.findOneAndUpdate(
        {_id: orderId, 'products.productid': productid},
        { $set: { 'products.$.status': 'Canceled', 'products.$.reason': reason } },
        { new : true }
      );
      console.log("asdfghjk",reason)
      console.log(order)
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      // Redirect to the orders page or send a response based on your requirement
      const product = order.products[0];

      const data = {
        userid: req.session.userid,
        product: product.productName, 
        amount: product.price * product.quantity
    };

      const user = await usercollection.findById(userId);
      console.log('Wallet before:', user);
      user.wallet += data.amount;
      await user.save();
      console.log('Wallet after:', user);


      const walletOrder = new wallet({
        Email: user.email,
        date: new Date(),
        amount: data.amount,
        creditordebit: "Credited",
    });

      await walletOrder.save()
      res.redirect('/orders');
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  

  // exports.confirm = (req,res)=>{
  //   res.render('orderconfirm')
  // }

  // controllers/orderController.js


  //wallet

  // const userid=req.session.user
      // const product=await productcollection.findOne({_id:productid})
      // const userdetails=await usercollection.findOne({_id:userid})
    // console.log(userdetails.wallet,"before  ");
    //   if (order.paymentMethod === 'wallet' || order.paymentMethod === 'Razorpay') {
    //     const product = order.products[0];

    //     const data = {
    //         amount: product.price * product.quantity
    //     };

    //     const user = await usercollection.findById(req.session.user);
    //    const walletam= user.wallet += data.amount; 
    //     await user.save();
    //     console.log('Wallet After:', walletam);
    //   }


    exports.returnOrder = async (req, res) => {
      const productid = req.params.productid;
      const orderId = req.params.order_id;
      const returnReason = req.body.reason;
  
      console.log('Product ID:', productid);
      console.log('Order ID:', orderId);
      console.log('Return Reason:', returnReason);
  
      try {
          // Find the order and update the product status to 'Returned' and set the reason
          const order = await OrderDb.findOneAndUpdate(
              { _id: orderId, 'products.productid': productid },
              {
                  $set: {
                      'products.$.status': 'Returned',
                      'products.$.reason': returnReason,
                  }
              },
              { new: true }
          );
  
          if (!order) {
              return res.status(404).json({ error: 'Order not found' });
          }
  
          // Additional logic if needed
  
          res.redirect('/orders')
      } catch (error) {
          console.error(error);
          res.status(500).json({ error: 'Internal server error' });
      }
  };


exports.applyCoupon = async (req, res) => {
  try {
    console.log("coupn")
    const user = req.session.user;
    const user_id = user._id
    const couponCode = req.body.couponCode;
    const orderTotalPrice = req.session.orderTotalPrice; 

    
    const coupon = await coupen.findOne({ coupencode: couponCode, expiredate: { $gte: new Date() } });

    if (coupon) {
     
      const discountedTotalPrice = orderTotalPrice - coupon.discount;
            
      req.session.discountedTotalPrice = discountedTotalPrice;

      res.redirect(`/cart/${user_id}`);
    } else {
      
      res.redirect(`/cart/${user_id}`); 
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};
exports.inccart = async (req, res) => {
  try {
      const pid = req.params.id;
      console.log("id is", pid);

      // Find the cart item
      const item = await cartcollection.findOne({ _id: pid });

      // Check if the item exists
      if (!item) {
          return res.status(404).json({
              success: false,
              message: 'Cart item not found'
          });
      }

      // Get product information
      const productId = item.productid;
      const productStock = (await productcollection.findById(productId)).stock;
      console.log("prstock",productStock);
      // Check if the new quantity exceeds the available stock
      const newQuantity = item.quantity + 1;
      if (newQuantity > productStock) {
        console.log('stck exeed');
          return res.status(400).json({
              success: false,
              message: 'Quantity exceeds stock.'
          });
      } else {
          // Calculate new price
          const newPrice = item.price * newQuantity;

          // Update the quantity in the database
          const updateResult = await cartcollection.updateOne(
              { _id: pid },
              { $set: { quantity: newQuantity } }
          );

          if (updateResult.modifiedCount === 1) {
              // The update was successful
              // Calculate the overall total price
              const overallTotalPrice = await calculateOverallTotalPrice();

              // Send the response including the newOverallTotalPrice
              return res.status(200).json({
                  success: true,
                  newQuantity,
                  newPrice,
                  newOverallTotalPrice: overallTotalPrice,
                  message: 'Quantity increased successfully'
              });
          } else {
              return res.status(500).json({
                  success: false,
                  message: 'Failed to update quantity in the database'
              });
          }
      }
  } catch (error) {
      console.error('Error in inccart:', error);

      // Handle specific errors
      if (error.name === 'CastError' && error.kind === 'ObjectId') {
          return res.status(400).json({
              success: false,
              message: 'Invalid cart item ID'
          });
      }
      res.status(500).json({
          success: false,
          message: 'Internal Server Error',
          error: error.message
      });
  }
};





exports.deccart = async (req, res) => {
  try {
      const pid = req.params.id;
      const item = await cartcollection.findOne({ _id: pid });
      const newQuantity = Math.max(item.quantity - 1, 1);
      const newPrice = item.price * newQuantity;

      // Update the quantity in the database
      await cartcollection.updateOne(
          { _id: pid },
          { $set: { quantity: newQuantity } }
      );

      // Calculate the overall total price (sum of prices for all items in the cart)
      const overallTotalPrice = await calculateOverallTotalPrice();

      // Send the response including the newOverallTotalPrice
      res.status(200).json({
          success: true,
          newQuantity,
          newPrice,
          newOverallTotalPrice: overallTotalPrice,
          message: 'Quantity decreased successfully'
      });
  } catch (error) {
      console.error(error);
      res.status(500).json({
          success: false,
          message: 'Error decreasing quantity',
          error: error.message
      });
  }
};

// Function to calculate overall total price
const calculateOverallTotalPrice = async () => {
  const cartItems = await cartcollection.find({});
  let overallTotalPrice = 0;

  // Sum up the prices for all items in the cart
  for (const item of cartItems) {
      const itemPrice = parseFloat(item.price); // Convert item.price to a number
      overallTotalPrice += item.quantity * itemPrice;
  }

  return overallTotalPrice;
};