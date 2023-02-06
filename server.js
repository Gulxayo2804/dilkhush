const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const path = require('path')
const pathdir = require('path').join(__dirname, '/public/uploads')
const connectDB = require('./config/db')
connectDB();

app.use('/public/uploads', express.static(pathdir));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('./public'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('public/uploads'));
app.use('/uploads', express.static(__dirname + '/public/uploads'))
 
app.get('/',(req,res)=>{
    res.send('Welcome to website')
})
app.use('/api/category', require('./routes/categoryRouter'))
app.use('/api/user', require('./routes/userRouter'))
app.use('/api/product', require('./routes/productRouter'))
app.use('/api/basket', require('./routes/basketRouter'))
app.use('/api/order', require('./routes/orderRouter'))
app.use('/api/card', require('./routes/cardRouter'))
app.use('/api/photo', require('./routes/photoRouter'))
app.use('/api/band', require('./routes/bandRouter'))
app.use('/api/payme', require('./routes/payme'));
app.use('/api/pay', require('./routes/pay'))
app.use('/api/buy',require('./routes/buy'))

const PORT = process.env.PORT||3000
app.listen(PORT, () => {
    console.log(`${PORT} server running now`)
})