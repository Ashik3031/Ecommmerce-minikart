const express = require('express');
const Razorpay = require('razorpay');
require('dotenv').config();
const cartcollection = require('../model/cart')
const ordercollection = require('../model/order')


 

exports.razorPayment = async (req, res) => {
   try {
    const orderprice=req.body.orderprice
    var instance = new Razorpay({ key_id: process.env.KEY_ID, key_secret: process.env.KEY_SECRET });
    var options = {
      amount: orderprice,
      currency: "INR",
      receipt: "order_rcptid_11",
    };

    // Creating the order
    instance.orders.create(options, function (err, order) {
      if (err) {
        console.error(err);
        res.status(500).send("Error creating order");
        return;
      }

      console.log(order);
      // Add orderprice to the response object
      res.send({ orderId: order.id });

    
    });
   } catch (error) {
    console.log(error);
   }
  };
  

