const mongoose=require('mongoose')

const merchantKeySchema = new mongoose.Schema({
    merchantKey: {
        type: String, required: true
    }
},{collection: 'merchantKey'});

module.exports  = mongoose.model('merchantKey', merchantKeySchema);