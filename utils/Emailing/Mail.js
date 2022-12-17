const sendgrid = require('@sendgrid/mail')

const sendEmail = async(name,email,tokenVerification,origin,txt) =>{

    sendgrid.setApiKey(process.env.SENDGRID_API);
    
    const verifyLink = `${origin}/user/verify-email?token=${tokenVerification}&email=${email}`
    const mesg = `Hello ${name}, Please verify your Email with this link: <a href="${verifyLink}">${txt}</a>`
  
      const msg = {
        to: email,
        from: 'Marvelloussolomon49@gmail.com', 
        subject: 'Please verify your Email',
        html: mesg,
      };
      
      await sendgrid.send(msg)
  
  }



  module.exports = {sendEmail}