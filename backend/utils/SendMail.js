const nodemailer = require("nodemailer");

const sendResetMail = async (email, resetToken, type) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Demande de reinitialisation du mot de passe",
      html: `
                <h2>Reinitialisation du mot de passe</h2>
                <p>Vous avez demande la reinitialisation de votre mot de passe. Cliquez sur le lien ci-dessous pour definir un nouveau mot de passe. Ce lien est valable pendant 10 minutes.</p>
                <a href="${process.env.FRONTEND_API_LINK}/${type}/update-password/${resetToken}" target="_blank">Reinitialiser le mot de passe</a>
                <p>Si vous n'etes pas a l'origine de cette demande, veuillez ignorer cet e-mail.</p>
            `,
    };

    await transporter.sendMail(mailOptions);
    console.log("E-mail de reinitialisation envoye avec succes");
  } catch (error) {
    console.error("Error sending reset email:", error);
    throw new Error("Impossible d'envoyer l'e-mail de reinitialisation");
  }
};

module.exports = sendResetMail;
