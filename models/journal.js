const mongoose = require('mongoose')
const JournalSchema = new mongoose.Schema({
    system: {
        type: String,
        index: true,
        required: true
    },
    amount: {
        type: Number,
        index: true,
        required: true
    },
    order: {
        type: mongoose.Schema.ObjectId,
        ref: 'Order',
        index: true,
        required: true
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('Journal', JournalSchema)