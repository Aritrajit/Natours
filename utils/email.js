const nodemailer = require('nodemailer');
const pug = require('pug');
//const htmlToText = require('html-to-text');
//var textVersion = require("textversionjs");

module.exports = class Email {
    constructor(user, url) {
        this.to = user.email;
        this.firstName = user.name.split(' ')[0];
        this.url = url;
        this.from = `Aritrajit Das <${process.env.EMAIL_FROM}>`
        
    }

    newTransport() {
        if (process.env.NODE_ENV === 'production') {
            //sendgrid
            return nodemailer.createTransport({
                host: 'smtp.sendgrid.net',
                port: 587,
                auth: {
                    user: "apikey",
                    pass: process.env.SENDGRID_PASSWORD
                }
            })
        }

        return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port:process.env.EMAIL_PORT,
        auth: {
            user:process.env.EMAIL_USERNAME,
            pass:process.env.EMAIL_PASSWORD
        }
      })
    }

    async send(template , subject) {
        //Send the actual email
        //1)Render the html based on the pug template
        const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
            firstName: this.firstName,
            url: this.url,
            subject : subject
        })

        //2)Define the email options
        const mailOptions = {
        from: this.from,
        to: this.to,
        subject: subject,
        html: html
        //text: textVersion.htmlToPlainText(html)
        
        }

        //3) Create a transport and send email
        await this.newTransport().sendMail(mailOptions);
    }

    async sendWelcome() {
       await this.send('welcome' , 'Welcome to the Natours Family' ); //this because they are to be defined on the current object created
    }

    async sendPasswordReset() {
       await this.send('passwordReset' , 'Your password reset token (valid for only 10 minutes)' ); //this because they are to be defined on the current object created
    }
}

//const sendEmail =async options => {
    //3 steps must be followed to send mail with node mailer
    //  1) Create a transporter
    // const transporter = nodemailer.createTransport({
    //     host: process.env.EMAIL_HOST,
    //     port:process.env.EMAIL_PORT,
    //     auth: {
    //         user:process.env.EMAIL_USERNAME,
    //         pass:process.env.EMAIL_PASSWORD
    //     }
    // })

    //2) Define the email options
    // const mailOptions = {
    //     from: 'Aritrajit Das <test@gmail.com>',
    //     to: options.email,
    //     subject: options.subject,
    //     text: options.message
    //     //html:
    // }

    //3)send email with nodemailer
//     await transporter.sendMail(mailOptions)//this is a async functio so we must await it as it returns a promise
// }

// module.exports = sendEmail;