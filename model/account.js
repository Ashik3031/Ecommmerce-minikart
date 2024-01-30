const mongoose = require('mongoose');

const loginschema = new mongoose.Schema({
    username: {
        type: String,
    },
    email:{
        type:String,
    },
    password: {
        type: String,
    },
    status:{
        type:Boolean,
        default: false
    },
    wallet:{
        type:Number
    },
    referralCode: {
        type: String,
      }

})
const collection = new mongoose.model("sample", loginschema)

module.exports = collection