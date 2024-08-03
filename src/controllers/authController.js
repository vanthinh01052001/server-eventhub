const UserModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");

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
module.exports = {
  register,
  login,
};

const getJsonWebToken = async (email, id) => {
  const payload = { email, id };
  const token = jwt.sign(payload, process.env.SECRET_KEY, {
    expiresIn: "7d",
  });
  return token;
};
