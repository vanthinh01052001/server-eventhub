const UserModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  auth: {
    user: process.env.USERNAME_EMAIL,
    pass: process.env.PASSWORD_EMAIL,
  },
});
const getJsonWebToken = async (email, id) => {
  const payload = { email, id };
  const token = jwt.sign(payload, process.env.SECRET_KEY, {
    expiresIn: "7d",
  });
  return token;
};

const register = asyncHandler(async (req, res) => {
  const { fullname, email, password } = req.body;
  const existingUser = await UserModel.findOne({ email });
  if (existingUser) {
    res.status(401);
    throw new Error("User has already existed!");
  }
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const newUser = new UserModel({
    fullname: fullname ?? "",
    email: email,
    password: hashedPassword,
  });
  await newUser.save();
  res.status(200).json({
    status: 200,
    message: "Register new user successfully",
    data: {
      id: newUser.id,
      email: newUser.email,
      accessToken: await getJsonWebToken(email, newUser.id),
    },
  });
});
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const existingUser = await UserModel.findOne({ email });
  if (!existingUser) {
    res.status(403).json({
      status: 403,
      message: "User not found!!!",
    });
    return;
  }
  const isMatchPassword = await bcrypt.compare(password, existingUser.password);
  if (!isMatchPassword) {
    res.status(401).json({
      status: 401,
      data: {
        message: "Email or password not correct!",
      },
    });
    return;
  }
  res.status(200).json({
    status: 200,
    message: "Login successfully!",
    data: {
      id: existingUser.id,
      email: email,
      accessToken: await getJsonWebToken(email, existingUser.id),
    },
  });
});

const handleSendEmail = async (val) => {
  try {
    await transporter.sendMail(val);
    return "OK";
  } catch (error) {
    return `Can not send email ${error}`;
  }
};
const verification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const verificationCode = Math.floor(1000 + Math.random() * 9000);
  try {
    const data = {
      from: `Support EventHub Application <${process.env.USERNAME_EMAIL}>`,
      to: email,
      subject: "Vertification email code",
      text: "Your code to verification email",
      html: `<h1>${verificationCode}</h1>`,
    };
    await handleSendEmail(data);
    res.status(200).json({
      status: 200,
      message: "Send verification code successfully!",
      data: {
        code: verificationCode,
      },
    });
  } catch (error) {
    res.status(401).json({
      status: 401,
      message: "Send verification code failed!",
    });
  }
});
const generateRandomPassword = (length) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}|;:,.<>?";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    password += characters[randomIndex];
  }
  return password;
};
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const randomPassword = generateRandomPassword(8);
  const data = {
    from: `New password <${process.env.USERNAME_EMAIL}>`,
    to: email,
    subject: "Reset password",
    text: "Your password is: ",
    html: `<h1>${randomPassword}</h1>`,
  };

  const user = await UserModel.findOne({ email });
  if (user) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(`${randomPassword}`, salt);
    await UserModel.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      isChangePassword: true,
    })
      .then(() => {
        console.log("Done");
      })
      .catch((error) => console.log(error));
    await handleSendEmail(data)
      .then(() => {
        res.status(200).json({
          status: 200,
          message: "Send email new password successfully.",
          data: [],
        });
      })
      .catch((error) => {
        res.status(401).json({
          status: 401,
          message: "Reset Password Failed.",
        });
      });
  } else {
    res.status(401).json({
      status: 401,
      message: "User not found.",
    });
  }
});
module.exports = {
  register,
  login,
  verification,
  forgotPassword,
};
