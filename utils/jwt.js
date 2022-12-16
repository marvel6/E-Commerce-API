const jwt = require('jsonwebtoken');

const createJWT = ({ payload }) => {
  const token = jwt.sign(payload, process.env.JWT_SECRET);
  return token;
};

const isTokenValid = (token) => jwt.verify(token, process.env.JWT_SECRET);

const attachCookiesToResponse = ({ res, user, refreshToken }) => {

  const accessToken = createJWT({ payload: { user } });
  const refreshTokens = createJWT({ payload: { user, refreshToken } });

  const oneDay = 1000 * 60 * 60 * 24;
  const lastingTime = 1000 * 60 * 60 * 24 * 30;


  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    expires: new Date(Date.now() + oneDay),
    secure: process.env.NODE_ENV === 'production',
    signed: true,
  });


  res.cookie('refreshToken', refreshTokens, {
    httpOnly: true,
    expires: new Date(Date.now() + lastingTime),
    secure: process.env.NODE_ENV === 'production',
    signed: true,
  });




};

module.exports = {
  createJWT,
  isTokenValid,
  attachCookiesToResponse,
};
