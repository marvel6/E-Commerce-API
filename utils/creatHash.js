const crypto = require('crypto')


const hashToken = (string) => crypto.createHash('md5').update(string).digest('hex')


module.exports = {hashToken}