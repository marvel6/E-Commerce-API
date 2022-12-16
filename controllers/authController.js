const User = require('../models/User');
const { StatusCodes } = require ('http-status-codes');
const CustomError = require ('../errors');
const { attachCookiesToResponse, createTokenUser } =  require ('../utils');
const crypto = require('crypto')
const {sendEmail} = require('../utils/Emailing/Mail')
const tokensModel = require('../models/tokenModel')

const register = async (req, res) => {
  const { email, name, password } = req.body;

  const emailAlreadyExists = await User.findOne({ email });
  if (emailAlreadyExists) {
    throw new CustomError.BadRequestError('Email already exists');
  }


  const origin = 'http://localhost:3000'

  const isFirstAccount = (await User.countDocuments({})) === 0;
  const role = isFirstAccount ? 'admin' : 'user';

  const tokenVerification = crypto.randomBytes(35).toString('hex')

  const user = await User.create({ name, email, password, role,  tokenVerification });

  sendEmail(name,email,tokenVerification,origin)

  res.status(StatusCodes.CREATED).json({ msg: 'Sucess please check your Email ' ,tokenVerification})

};





const verifyEmail = async (req, res) => {    //verification of Email and pre-token

  const { tokenVerification, email } = req.body


  if (!email) {
    throw new CustomError.NotFoundError('please a valid Email')
  }

  const user = await User.findOne({ email })

  if (!user) {
    throw new CustomError.NotFoundError('Invalid Credentials user with email not found')
  }

  if (tokenVerification !== user.tokenVerification) {

    throw new CustomError.NotFoundError('Invalid Credentials')
  }

  user.isVerified = true
  user.tokenVerification = ' ';
  user.verified = Date.now()


  user.save()

  res.status(StatusCodes.OK).json({ msg: 'User verified please proceed' })

}




const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new CustomError.BadRequestError('Please provide email and password');
  }
  const user = await User.findOne({ email });

  if (!user) {
    throw new CustomError.UnauthenticatedError('Invalid Credentials');
  }
  const isPasswordCorrect = await user.comparePassword(password);

  if (!isPasswordCorrect) {
    throw new CustomError.UnauthenticatedError('Invalid Credentials');
  }

const tokenUser = createTokenUser(user);


let refreshToken = ''

refreshToken = crypto.randomBytes(35).toString('hex')


const tokenModel = await tokensModel.findOne({user:user._id})


//verifiy the user Boolean true/false

if(tokenModel){
  const {isValid} = tokenModel

  if(!isValid){
    throw new CustomError.UnauthenticatedError('User not validated, please re-try')
  }

  refreshToken = tokenModel.refreshToken
  attachCookiesToResponse({ res, user: tokenUser ,refreshToken});
  res.status(StatusCodes.OK).json({ user: tokenUser });
  return;

}



let ip = req.ip;
let userAgent = req.headers['user-agent'];

const tokenDb = {ip,userAgent,refreshToken,user:user._id}

await tokensModel.create(tokenDb)
  
attachCookiesToResponse({ res, user: tokenUser ,refreshToken});

res.status(StatusCodes.OK).json({ user: tokenUser });

};




const logout = async (req, res) => {   

await tokensModel.findOneAndDelete(req.user.userId)

  res.cookie('accessToken', 'logout', {
    httpOnly: true,
    expires: new Date(Date.now()),
  });

  res.cookie('refreshToken', 'logout', {
    httpOnly: true,
    expires: new Date(Date.now()),
  });

  res.status(StatusCodes.OK).json({ msg: 'user logged out!' });
};




module.exports = {
  register,
  login,
  logout,
  verifyEmail
};
