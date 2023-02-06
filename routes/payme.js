const express = require('express')
const router = express.Router()
const MerchantKey =require('../models/Payment/merchantKeyModel')
const Order =require('../models/Payment/merchantKeyModel')
const Transaction =require('../models/Payment/tranactionModel')


router.post('/isPayed', async function(req,res){
    // Authorization: -32504
      let key = await MerchantKey.findOne();
      if(!req.header("Authorization")) return res.status(200).send({
        "error": {
          "code": -32504,
          "message": {
              "ru": "Неверная авторизация",
              "uz": "Noto'g'ri avtorizatsiya",
              "en": "Invalid authorization"
          },
          "data": "Authorization"
        },
        "id": req.body.id
      });
      if(key.merchantKey !== req.header("Authorization").substr(6)){
        return res.status(200).send({
          "error": {
            "code": -32504,
            "message": {
                "ru": "Неверная авторизация",
                "uz": "Noto'g'ri avtorizatsiya",
                "en": "Invalid authorization"
            },
            "data": "Authorization"
          },
          "id": req.body.id
        })
      }
    async function validation(data) {
      // Non-existent account (order): -31099 -- -31050
      if(!mongoose.Types.ObjectId.isValid(data.params.account["order_id"])){
        return {
          "error": {
            "code": -31098,
            "message": {
                "ru": "Неверный заказ",
                "uz": "Noto'g'ri buyurtma",
                "en": "Invalid order"
            },
            "data": "order_id"
          },
          "id": req.body.id
        }
      };
      // Invalid account (order): -31099 -- -31050
      const order = await Order.findById(data.params.account["order_id"]);
      if(!order) {
        return {
          "error": {
            "code": -31097,
            "message": {
                "ru": "Заказ не найден",
                "uz": "Buyurtma topilmadi",
                "en": "Order not found"
            },
            "data": "order_id"
          },
          "id": data.id
        }
      };
      // Invalid amount: -31001
      if(order.summ*100 !== data.params.amount){
        return {
          "error": {
            "code": -31001,
            "message": {
              "ru": "Неверная сумма",
              "uz": "Noto'g'ri summa",
              "en": "Invalid amount"
            },
            "data": "amount"
          },
          "id": data.id
        }
      };
    };
    switch (req.body.method) {
      // CheckPerformTransaction
      case "CheckPerformTransaction": {
        let err = await validation(req.body);
        if(err) return res.status(200).send(err);
        const otherTransaction = await Transaction.findOne({order_id: req.body.params.account["order_id"]});
          if(otherTransaction){
            return  res.status(200).send({
                "error": {
                    "code": -31095,
                    "message": {
                        "ru": "Есть еще одна транзакция",
                        "uz": "Boshqa tranzaksiya mavjud",
                        "en": "There is another transaction"
                    },
                    "data": "anotherTransaction"
                },
                "id": req.body.id
              })
          }
        let order = await Order.findById(req.body.params.account["order_id"]);
        // { state: 0, msg: "naqd to'langan/to'lanadi"}
        // { state: 1, msg: "kutilmoqda"}
        // { state: -1, msg: "tranzaksiya bekor qilingan"}
        // { state: 2, msg: "payme bilan to'langan"}
        // { state: -2, msg: "tranzaksiya bekor qilingan"}
        if(order.payState.state === 1) {
          return res.status(200).send({
              "result" : {
                  "allow" : true
              }
          })
        } else {
          return res.status(200).send({
            "error": {
              "code": -31096,
              "message": {
                "uz": order.payState.msg,
                "ru": order.payState.msg,
                "en": order.payState.msg
              },
              "data": "CheckPerformTransaction"
            },
            "id": req.body.id
          })
        }
      }
      case "CreateTransaction": { 
        let err = await validation(req.body);
        if(err) return res.status(200).send(err);
        let order = await Order.findById(req.params.account["order_id"]);
        let transaction = await Transaction.findOne({paycom_transaction_id: req.body.params.id});
        if(!transaction){
          const otherTransaction = await Transaction.findOne({order_id: req.body.params.account["order_id"]});
          if(otherTransaction){
            return  res.status(200).send({
                "error": {
                    "code": -31095,
                    "message": {
                        "ru": "Есть еще одна транзакция",
                        "uz": "Boshqa tranzaksiya mavjud",
                        "en": "There is another transaction"
                    },
                    "data": "anotherTransaction"
                },
                "id": req.body.id
              })
          }else{
            if(order.payState.state === 1){
              const newTransaction = await new Transaction({
                  paycom_transaction_id: req.body.params.id,
                  paycom_time: req.body.params.time,
                  paycom_time_datetime: new Date(req.body.params.time),
                  create_time: Date.parse(new Date),
                  amount: req.body.params.amount,
                  state: 1,
                  receivers: [
                    { "id" : "5fd1cb3b1c849a7578de13b0", "amount" : 100000 },
                    { "id" : "4215e6bab097f420a62ced01", "amount" : req.body.params.amount - 100000 }
                  ],
                  order_id: order._id
              })
              await newTransaction.save();
              return res.status(200).send({
                "result" : {
                    "create_time" : newTransaction.create_time,
                    "transaction" : newTransaction._id,
                    "state" : newTransaction.state,
                    "receivers" : newTransaction.receivers
                }
              })
            }else{
              return res.status(200).send({
                "error": {
                  "code": -31099,
                  "message": {
                    "ru": "Заказ не доступен",
                    "uz": "Buyurtma blon",
                    "en": "Order blocked" 
                  },
                  "data": "amount"
                },
              })
            }
          }
        }else{
          if(transaction.state === 1){
            const timeDiff = Date.parse(new Date) - transaction.create_time
              if(timeDiff > 3600000 ){      // 1 hour
                transaction.state = -1;
                transaction.reason = 4;
                await transaction.save();
                return res.status(200).send({
                  "error": {
                    "code": -31008,
                    "message": {
                        "ru": "Невозможно выполнить данную операцию",
                        "uz": "Joriy operatsiyani amalga oshirib bo'lmaydi",
                        "en": "Cannot execute this operation"
                    },
                },
                "id": req.body.id,
                "state": transaction.state,
                "reason": transaction.reason
                })
              }
              return res.status(200).send({
                "result" : {
                    "create_time" : transaction.create_time,
                    "transaction" : transaction._id,
                    "state" : transaction.state,
                    "receivers" : transaction.receivers
                }
              })
          }else{
            return res.status(200).send({
                  "error": {
                    "code": -31008,
                    "message": {
                        "ru": "Невозможно выполнить данную операцию",
                        "uz": "Joriy operatsiyani amalga oshirib bo'lmaydi",
                        "en": "Cannot execute this operation"
                    },
                },
                "id": req.body.id,
                "state": transaction.state,
                "reason": transaction.reason
                })
          }
        }
        } 
      case "PerformTransaction": {
        let transaction = await Transaction.findOne({paycom_transaction_id: req.body.params.id});
        if(!transaction) return res.status(200).send({
          "error": {
              "code": -31003,
              "message": {
                  "ru": "Транзакция не найдена",
                  "uz": "Transaksiya topilmadi",
                  "en": "Transaction not found"
              },
          },
          "id": req.body.id
        })
        switch (transaction.state) {
          case 1:{
            const timeDiff = Date.parse(new Date) - transaction.create_time
            if(timeDiff > 3600000 ){      // 1 hour
              transaction.state = -1;
              transaction.reason = 4;
              await transaction.save();
              return res.status(200).send({
                "error": {
                  "code": -31008,
                  "message": {
                      "ru": "Невозможно выполнить данную операцию",
                      "uz": "Joriy operatsiyani amalga oshirib bo'lmaydi",
                      "en": "Cannot execute this operation"
                  },
              },
              "id": req.body.id,
              "state": transaction.state,
              "reason": transaction.reason
              })
            }
            let order = await Order.findById(transaction.order_id);
            order.payState = { state: 2, msg: "payme bilan to'langan" }
            await order.save();
            transaction.state = 2
            transaction.perform_time = new Date;
            await transaction.save();
            return res.status(200).send({
              "result" : {
                  "transaction" : transaction._id,
                  "perform_time" : transaction.perform_time,
                  "state" : transaction.state
              }
            })
            }
          case 2:
            return res.status(200).send({
              "result" : {
                  "transaction" : transaction._id,
                  "perform_time" : transaction.perform_time,
                  "state" : transaction.state
              }
            })
          default:
            return res.status(200).send({
              "error": {
                "code": -31008,
                "message": {
                    "ru": "Невозможно выполнить данную операцию",
                    "uz": "Joriy operatsiyani amalga oshirib bo'lmaydi",
                    "en": "Cannot execute this operation"
                },
            },
            "id": req.body.id
            })
        }
      }
      case "CheckTransaction": {
        let transaction = await Transaction.findOne({paycom_transaction_id: req.body.params.id});
        if(!transaction) 
          return res.status(200).send({
            "error": {
            "code": -31003,
            "message": {
              "ru": "Транзакция не найдена",
              "uz": "Transaksiya topilmadi",
              "en": "Transaction not found"
            },
            "data": "CheckTransaction"
            },
            "id": req.body.id
          })
        let {create_time, perform_time, cancel_time, _id, state, reason} = transaction;
        return res.status(200).send({
          "result" : {
              "create_time" : create_time,
              "perform_time" : perform_time || 0,
              "cancel_time" : cancel_time || 0,
              "transaction" : _id,
              "state" : state,
              "reason" : reason || null
          }
        })
      }
      case "CancelTransaction": {
        let transaction = await Transaction.findOne({paycom_transaction_id: req.body.params.id});
        if(!transaction) 
          return res.status(200).send({
            "error": {
            "code": -31003,
            "message": {
              "ru": "Транзакция не найдена",
              "uz": "Transaksiya topilmadi",
              "en": "Transaction not found"
            },
            "data": "CheckTransaction"
            },
            "id": req.body.id
          })
        if(transaction.state === 1) transaction.state = -1;
        else if(transaction.state === 2) transaction.state = -2;
        else if(transaction.state === -1 || transaction.state === -2)
            return res.status(200).send({
              "result" : {
                  "transaction" : transaction._id,
                  "cancel_time" : transaction.cancel_time,
                  "state" : transaction.state
              }
            })
        transaction.cancel_time = Date.parse(new Date);
        transaction.reason = req.body.params.reason || null;
        await transaction.save();
        return res.status(200).send({
          "result" : {
              "transaction" : transaction._id,
              "cancel_time" : transaction.cancel_time,
              "state" : transaction.state
          }
        })
      }
      case "ChangePassword":
          let newKey = new Buffer("Paycom:" + req.body.params.password);
          key.merchantKey = newKey.toString('base64');
          await key.save()
          return res.status(200).send({
              "result" : {
                  "success" : true
              }
          })
      case "GetStatement":
        const transactions = await Transaction.find({paycom_time:{$lte : req.body.params.to, $gte : req.body.params.from}});
        return res.status(200).send({
          "result":{
            "transactions": transactions
          }
        })
      default: return res.status(200).send("Mavjud bo'lmagan metod")
    }
      // let order = await Order.findByIdAndUpdate(req.params.id,{isPayed:true},{new: true});
      // if(!order) return res.send('No order with this id');
      // return res.status(200).send(order);
  });


  module.exports = router;