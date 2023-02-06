const Order = require('../models/orders')
const {RPCErrors} = require('../utils/RPCErrors')
const {BillingErrors} = require('../utils/BillingErrors')
const {request,response} = require('express')
exports.CheckPerformTransaction = async function (id,amount){
    await Order.findOne({orderId: id},(err,data)=>{
        if(err || !data ) return sendResponse(BillingErrors.OrderNotFound(),null);
        if(data.amount !== amount)  return sendResponse(BillingErrors.IncorrectAmount(),null);
        return  sendResponse(null,{
            allow: true
        })
    })
}
