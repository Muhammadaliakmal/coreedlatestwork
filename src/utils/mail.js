import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const SendEmail = async (options) => {
  const mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "Project Manager",
      link: "https://taskmanagerlink.com",
    },
  });

  //email in text format
  const emailText = mailGenerator.generatePlaintext(options.mailgenContent);

  // email in html format
  const emailHTML = mailGenerator.generate(options.mailgenContent);

  // creating transporter for sending email
  const transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_SMTP_HOST,
    port: process.env.MAILTRAP_SMTP_PORT,

    auth: {
      user: process.env.MAILTRAP_SMTP_USER,
      pass: process.env.MAILTRAP_SMTP_PASS,
    },
  });

  // defining mail options
  const mail = {
    from: "mail.taskmanager@example.com",
    to: options.email,
    subject: options.subject,
    text: emailText,
    html: emailHTML,
  };
  // send email
  try {
    await transporter.sendMail(mail);
  } catch (error) {
    console.log(" ❌ Error sending email", error);
  }
};

//---------------------------------email Verification MailGen Content------------------------------------------//
const emailVerificationMailGenContent = (username, verificationURL) => {
  return {
    body: {
      name: username,
      intro: "welcome to our app! we are very excited to have you on board",
      action: {
        instructions: "plaese click the button below to verify your account",
        button: {
          color: "#0c5504a0", // Optional action button color
          text: "Confirm your account",
          link: verificationURL,
        },
      },
      outro:
        "need help ,or have questions? just reply to this email ,we'd love to help",
    },
  };
};

//---------------------------------Forget Password Verification MailGen Content------------------------------------------//

const forgetPasswordMailGenContent = (username, passwordResetURL) => {
  return {
    body: {
      name: username,
      intro:
        "you have requested to reset your password. please click the button below to reset your password",
      action: {
        instructions: "plaese click the button below to reset your password",
        button: {
          color: "#0c5504a0", // Optional action button color
          text: "reset your password",
          link: passwordResetURL,
        },
      },
      outro:
        "need help ,or have questions? just reply to this email ,we'd love to help",
    },
  };
};

export { emailVerificationMailGenContent, forgetPasswordMailGenContent,SendEmail };
