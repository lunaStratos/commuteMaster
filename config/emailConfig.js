var nodemailer = require('nodemailer');
const emailinfo = require('./emailInfo');
// var mailConfig = {
//   ssl: emailinfo.pool,
//   host: emailinfo.host,
//   port: emailinfo.port,
//   secure: emailinfo.secure, // use TLS
//   auth: emailinfo.auth
// };
var mailConfig = {
  service: 'gmail',
  auth: {
    user: emailinfo.gmail,
    pass: emailinfo.gmailpassword
  }
};

var transporter = nodemailer.createTransport(mailConfig);

module.exports = transporter;
