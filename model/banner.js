const mongoose = require('mongoose')

const bannerSchema = new mongoose.Schema({
    image: {
        type: String,
        required: true,
    },
    
})


const banner = mongoose.model('Banner', bannerSchema)
module.exports = banner;