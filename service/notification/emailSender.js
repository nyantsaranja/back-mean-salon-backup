const nodemailer=require("nodemailer");
const config=require("../../config");

process.env.NODE_ENV = process.env.NODE_ENV || 'development';
const envConfig = config[process.env.NODE_ENV];
const configMail = envConfig.configGmail;

/**le format de l'email
 * {
 *   from:"sender",
 *   to:"receiver",
 *   subject:"subject",
 *   text:"text",
 * }
 */
const sendEmail=(receiver, subject, text)=>{
     const content={
          from:configMail.auth.user,
          to:receiver,
          subject:subject,
          text:text
     }
     /* object transporter that send the email */
     const transporter=nodemailer.createTransport(configMail);

     transporter.sendMail(content,(err,info)=>{
         if(err){
             return false;
         }else{
             return true;
         }
     });
}
exports.emailSender={
     sendEmail
}
