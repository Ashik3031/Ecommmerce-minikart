const mongoose = require('mongoose');

const categoryschema = new mongoose.Schema({
    Name: {
        type: String,
        required: true,
        unique: true
    }
})

const catcollection = new mongoose.model("category", categoryschema)

module.exports = catcollection 