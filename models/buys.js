const mongoose = require('mongoose')
const BuySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        index: true,
        required: true
    },
    url: {
        type: String,
        index: true,
        required: true
    },
    num: {
        type: Number,
        index: true,
        required: true
    },
    size: {
        type: String,
        index: true,
        required: true
    },
    color: {
        type: String,
        index: true,
        required: true
    },
    comment: {
        type: String,
        index: true,
    },
    fikr: {
        type: String,
        index: true,
    },
    amount: {
        type: Number,
        index: true,
    },
    payed: {
        type: Number,
        enum: [0, 1],
        default: 0
    },
    paysystem: {
        type: String
    },
    order: {
        type: Number,
        required: true
    },
    status: {
        type: Number,
        enum: [0, 1, 2, 3, 4, 5, 6],
        // 0 - Yangi , 1 - Jo`natishga tayyor , 2 - Toshkentga jo`natildi
        // 3 - Toshkentga keldi , 4 - Yetkazildi , 5 - Bekor qilindi,6 - Zakaz qabul qilindi
        default: 0
    }
}, {
    timestamps: true
})
module.exports = mongoose.model('buy', BuySchema)