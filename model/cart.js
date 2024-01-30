const { ObjectId } = require('mongodb')
const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    userid: { type: ObjectId },
        productid: { type: String },
        product: { type: String },
        price: { type: Number },
        quantity: { type: Number },
        image: [{ type: String }]
});

const cart =new mongoose.model('cart', cartSchema);

module.exports = cart;