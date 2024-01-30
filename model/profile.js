const { ObjectId } = require('mongodb')
const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    userid: { type: ObjectId },
        image: { type: String }
});

const profile =new mongoose.model('profile', profileSchema);

module.exports = profile;