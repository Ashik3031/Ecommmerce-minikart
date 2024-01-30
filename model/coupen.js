const mongoose=require('mongoose')

const coupenschema=new mongoose.Schema({
    coupencode:{
        type:String
    },
    discount:{
        type:Number
    },
    expiredate:{
        type:Date
    },
    purchaseamount:{
        type:Number
    }
 
})
const coupen=new mongoose.model('coupens',coupenschema)

module.exports=coupen