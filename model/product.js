const category = require("../model/category")
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
        ref: category
  },
  model: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  offerprice: {
    type: Number,
  }, 
  stock:{
    type:Number,
    required: true
  },
  rating: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  images:[String],
  status: {
    type: Boolean,
    default:true,
  },
});

const Product =new mongoose.model('Product', productSchema);

module.exports = Product;