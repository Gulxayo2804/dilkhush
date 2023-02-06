const mongoose = require('mongoose')
const JournalSchema = new mongoose.Schema({
    system: {type: String, required: true},
    amount: {type: Number, required: true},
    order: {type: mongoose.Schema.ObjectId,ref: 'Buy' , required: true}
},{timestamps: true})

module.exports = mongoose.model('JournalBuy', JournalSchema)
