const User = require('../models/user')
const { StatusCodes } = require('http-status-codes')
const { findOne } = require('../models/user')
const customError = require('../errors')
const { attachCookiesToResponse, createTokenUser, sendVerificationEmail } = require('../utils/index')
const { connections } = require('mongoose')
const crypto = require('crypto')
const user = require('../models/user')
const { version } = require('os')
const tokenModel = require('../models/tokenModel')


const register = async (req, res) => {

  const { name, email, password } = req.body;

  const emailAreadyused = await User.findOne({ email })

  if (emailAreadyused) {
    throw new customError.BadRequestError('Email already registered, please use another email')
  }

  const isFirstAccount = await User.countDocuments({}) === 0
  const role = isFirstAccount ? 'admin' : 'user'

  const verificationToken = crypto.randomBytes(35).toString('hex')

  const user = await User.create({ name, email, password, role, verificationToken })

  const origin = 'http://localhost:3000'

  //await sendVerificationEmail({ name: user.name, email: user.email, verificationToken: user.verificationToken, origin })

  res.status(StatusCodes.CREATED).json({ msg: 'Sucess please check your Email ' })

}


const verifyEmail = async (req, res) => {
  const { verificationToken, email } = req.body

  const checkEmail = await user.findOne({ email })

  if (!checkEmail) {
    throw new customError.NotFoundError('User with Email not found please verify')
  }

  if (verificationToken !== checkEmail.verificationToken) {
    throw new customError.UnauthenticatedError('User not verified or verification Incorrect')
  }

  checkEmail.isVerified = true
  checkEmail.verified = Date.now()
  checkEmail.verificationToken = ''

  checkEmail.save()

  res.status(StatusCodes.OK).json({ msg: 'User email have been verified' })
}




const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new customError.BadRequestError('Please provide email and password');
  }
  const user = await User.findOne({ email });

  if (!user) {
    throw new customError.UnauthenticatedError('Invalid Credentials');
  }
  const isPasswordCorrect = await user.compare(password);
  if (!isPasswordCorrect) {
    throw new customError.UnauthenticatedError('Invalid Credentials');
  }

  if (!user.isVerified) {
    throw new customError.UnauthenticatedError('Please verify your Email')
  }

  const tokenUser = createTokenUser(user)


  //token-model implement

  let refreshToken = '';
  refreshToken = crypto.randomBytes(35).toString('hex')



  const isTokenExist = await tokenModel.findOne({user:user._id})

  if(isTokenExist){
     const {isValid} = isTokenExist

     if(!isValid){
      throw new customError.UnauthenticatedError('Invalid Credentials');
     }

     refreshToken = isTokenExist.refreshToken
     attachCookiesToResponse({ res, user: tokenUser,refreshToken });
     res.status(StatusCodes.OK).json({ user: tokenUser });
     return;
  }



  let userAgent = req.headers['user-agent'];
  let ip = req.ip
  

  const insertToken = {refreshToken,userAgent,ip,user:user._id}

   await tokenModel.create(insertToken)

  attachCookiesToResponse({ res, user: tokenUser,refreshToken });

  res.status(StatusCodes.OK).json({ user: tokenUser });

}



const logout = async (req, res) => {
  res.cookie('Token', 'logout', {
    httpOnly: true,
    expires: new Date(Date.now()),
  });

  res.status(StatusCodes.OK).json({ msg: 'user logged out!' });
}





module.exports = {
  register,
  login,
  logout,
  verifyEmail
}