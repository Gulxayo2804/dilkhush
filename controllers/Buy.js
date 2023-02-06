const Buy = require('../models/buys')
const jwt = require('jsonwebtoken')
// const SMS = require('../utils/SendSMS')
exports.create = async (req,res)=>{
    const token = req.headers.authorization
    // console.log(token)
    const user = jwt.decode(token.slice(7))

    const lastDat = await Buy.findOne().sort( { createdAt: -1 } ).exec();
    const num = lastDat ? lastDat.order + 1 : 1;
    const buy = new Buy({
        user: user.id,
        name: req.body.name,
        url: req.body.url,
        num: req.body.num,
        size: req.body.size,
        color: req.body.color,
        comment: req.body.comment,
        order: num,
    })
    buy.save()
        .then(()=>{
            res.status(201).json({success: true,data:buy})
        })
        .catch((err)=>{
            res.status(400).json({success: false,err})
        })
}
exports.all = async (req,res)=>{
    const limit = parseInt(req.query.limit)
    const page = parseInt(req.query.page)
    const skip = (page - 1 ) * limit
    const num = await Buy.countDocuments()
    await Buy.find()
        .sort({createdAt: -1})
        .populate(
            {path: 'user',select: {password: 0}}
        )
        .limit(limit)
        .skip(skip)
        .exec((err,data)=>{
            if(err) return res.status(400).json({success: false,err})
            res.status(200).json({success: true,num: num / limit,data})
        })
}
exports.me = async (req,res)=>{
    const token = req.headers.authorization
    // console.log(token)
    const user = jwt.decode(token.slice(7))

    await Buy.find({user: user.id})
        .sort({createdAt: -1})
        .populate(
            {path: 'user',select: {password: 0}}
        )
        .exec((err,data)=>{
            if(err) return res.status(400).json({success: false,err})
            res.status(200).json({success: true,data})
        })
}
exports.getById = async (req,res)=>{
    await Buy.findOne({_id: req.params.id})
        .populate(
            {path: 'user',select:{password:0,hash:0,code:0}}
        )
        .exec((err,data)=>{
            if(err) return res.status(400).json({success: false,err})
            res.status(200).json({success: true,data})
        })
}
exports.edit = async (req,res)=>{
    const buy = await Buy.findOne({_id: req.params.id})
        .populate('user')

    // if(req.body.amount){
    //     const phone = buy.user.phone
    //     const sms = `Ваш заказ № ${buy.order} подтверждён. Для оплаты перейдите в личный кабинет.`
    //     SMS(phone.slice(1),sms)
    // }
    // if(req.body.status === 2){
    //     const phone = buy.user.phone
    //     const sms = `Ваш заказ № ${buy.order} успешно отправлен в Ташкент.`
    //     SMS(phone.slice(1),sms)
    // }
    await Buy.updateOne({_id: req.params.id},{$set:req.body})
        .exec((err,data)=>{
            if(err) return res.status(400).json({success: false,err});
            return res.status(200).json({success: true})
        })
}
exports.delete = async (req,res)=>{
    await Buy.findByIdAndDelete({_id: req.params.id},(err,data)=>{
        if(err) return res.status(400).json({success: false,err});
        res.status(200).json({success: true,data:[]})
    })
}
