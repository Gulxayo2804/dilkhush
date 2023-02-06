const mongoose = require('mongoose')

const TransactionPayMe = new mongoose.Schema({
    tid: {type: String},
    time: {type: Number},
    state: {type: Number},
    create_time: {type: Number},
    perform_time: {type: Number},
    cancel_time: {type: Number},
    amount:{type: Number},
    transaction: {type: String, required: true, unique: true},
    order: {type: Number},
    buy: {type: Number},
    reason: {type: Number}
})

module.exports = mongoose.model('TransactionPayMe',TransactionPayMe)
