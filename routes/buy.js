const Buy = require('../controllers/Buy')
const express = require('express')
const router = express.Router();
const {protect} = require('../middleware/auth')

router.post('/create',protect,Buy.create)
router.get('/all',protect,Buy.all)
router.get('/me',protect,Buy.me)
router.get('/:id',protect,Buy.getById)
router.put('/:id',protect,Buy.edit)
router.delete('/:id',protect,Buy.delete)


module.exports = router;
