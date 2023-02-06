const base64 = require('base-64')
const {RPCErrors} = require('../utils/RPCErrors')

exports.auth = (req,res,next)=>{
    let token;
    if (req.headers.authorization &&
        req.headers.authorization.startsWith('Basic')) {
        token = req.headers.authorization.split(' ')[1];
    }
   const code = base64.encode('Paycom:zBnGw3@28ByVqDM?ib7ojWN9PCvuI3%PW&AG')
    if(!token || token !== code){
        return RPCErrors.AccessDeniet()
    }
    try {
        next();
    } catch (err) {
        return RPCErrors.AccessDeniet()
    }
}
