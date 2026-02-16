import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const SendEmail = async (options) => {
  // Check if email is provided and valid
  if (!options.email || typeof options.email !== 'string' || !options.email.includes('@')) {
    console.log(" ❌ Error sending email: No valid recipient email provided:", options.email);
    throw new Error("Invalid email address provided");
  }

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
  let transporter;
  
  // Check if production environment variables are set
  if (process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS) {
    // Production email configuration
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true' || parseInt(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Fallback to Mailtrap for development/testing
    transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_SMTP_HOST,
      port: parseInt(process.env.MAILTRAP_SMTP_PORT),
      auth: {
        user: process.env.MAILTRAP_SMTP_USER,
        pass: process.env.MAILTRAP_SMTP_PASS,
      },
    });
  }

  // defining mail options
  const mail = {
    from: process.env.EMAIL_FROM || '"Project Manager" <noreply@taskmanager.com>', // Use env variable or fallback
    to: options.email.trim(), // trim whitespace that might cause issues
    subject: options.subject,
    text: emailText,
    html: emailHTML,
  };

  // send email
  try {
    const result = await transporter.sendMail(mail);
    console.log(" ✅ Email sent successfully to:", options.email);
    return result;
  } catch (error) {
    console.log(" ❌ Error sending email to:", options.email, error);
    throw error; // Re-throw the error so calling functions can handle it
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
          color: "#1e09dea0", // Optional action button color
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
