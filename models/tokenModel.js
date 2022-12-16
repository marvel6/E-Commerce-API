const mongoose = require('mongoose')



const tokenModelVerification = new mongoose.Schema({
    refreshToken:{
        type:String,
        required:true
    },
    ip:{
        type:String,
        required:true
    },
    userAgent:{
        type:String,
        required:true
    },
    user:{
        type:mongoose.Schema.ObjectId,
        ref:'user',
        required:true
    },
    isValid:{
        type:Boolean,
        default:true
    }
},{timestamps:true})


module.exports = mongoose.model('UserToken',tokenModelVerification)