const nodemailer = require('nodemailer');

const transport = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.user,
        pass: process.env.pass
    }
})

module.exports.sendConfirmationEmail = (name, email, confirmationCode) => {
    transport.sendMail({
        from: process.env.user,
        to: email,
        subject: "Por favor, confirme seu email!",
        html: `
            <h1>Confirme seu email</h1>
            <h2>Olá, ${name}</h2>

            <p>Obrigado por se cadastrar em nosso site. Por favor confirme o seu email clicando no link abaixo.</p>

            <a href="http://localhost:5000/confirm/${confirmationCode}">LINK</a>
        `
    })
}