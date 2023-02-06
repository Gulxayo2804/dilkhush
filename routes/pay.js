const Pay = require('../controllers/Pay')
const express = require('express')
const router = express.Router()
const {auth} = require('../middleware/paymeAuth')

router.post('/payme', Pay.payme)
router.post('/payme/url', Pay.paymeUrl)


module.exports = router;
