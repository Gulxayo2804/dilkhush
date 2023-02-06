const mongoose=require('mongoose')

const tranactionsDataSchema = new mongoose.Schema({
    paycom_transaction_id: {type: String, required: true, maxLength: 25},
    paycom_time: {type: Number, required: true, maxLength: 13},
    paycom_time_datetime: {type: Date, required: true},
    create_time: {type: Number, required:true},
    perform_time: {type: Number},
    cancel_time: {type: Number},
    amount: {type: Number, required: true, min: 0},
    state: {type: Number, required: true},
    reason: {type: Number, default: null },
    receivers: {type: Array, default: null},
    order_id: {type: String, required: true}
},{collection: 'transaction'});

module.exports = mongoose.model('transaction', tranactionsDataSchema);