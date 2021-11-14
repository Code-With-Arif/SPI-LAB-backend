const nodemailer = require('nodemailer');
const { google } = require("googleapis");
const chalk = require('chalk');


const oAuth2Client = new google.auth.OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });


async function sendMail({ to, subject, text, html }) {

      try {

            const accessToken = await oAuth2Client.getAccessToken();

            const transport = nodemailer.createTransport({
                  service: 'gmail',
                  auth: {
                        type: 'OAuth2',
                        user: process.env.GUSER_NAME,
                        clientId: process.env.CLIENT_ID,
                        clientSecret: process.env.CLIENT_SECRET,
                        refreshToken: process.env.REFRESH_TOKEN,
                        accessToken: accessToken,
                  },
            });

            const mailOptions = {
                  from: process.env.GUSER_NAME,
                  to,
                  subject,
                  text,
                  html,
            };

            const result = await transport.sendMail(mailOptions, function (error, info) {
                  if (error) {
                        console.error(error);
                  } else {
                        console.log(chalk.cyanBright.bold('>>===> Email sent: ' + info.response));
                        if (typeof cb === "function") {
                              cb(error, info);
                        }
                  }
            });
            return result;

      } catch (err) {
            console.log(err);
            return err;
      }
}





// var transporter = nodemailer.createTransport({
//       service: 'gmail',
//       auth: {
//             user: process.env.GUSER_NAME,
//             pass: process.env.GUSER_PASSWORD
//       }
// });

// const sendMail = ({ to, subject, text, html }, cb) => {
//       var mailOptions = {
//             from: process.env.GUSER_NAME,
//             to,
//             subject,
//             text,
//             html
//       };

//       transporter.sendMail(mailOptions, function (error, info) {
//             if (error) {
//                   console.error(error);
//             } else {
//                   console.log(chalk.cyanBright.bold('>>===> Email sent: ' + info.response));
//                   if (typeof cb === "function") {
//                         cb(error, info);
//                   }
//             }
//       });
// }
module.exports = sendMail;