const UserModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");

const register = asyncHandler(async (req, res) => {
  const { fullname, email, password } = req.body;
  //   console.log("req.body", req.body);
  const existingUser = await UserModel.findOne({ email });
  //   console.log("existingUser", existingUser);
  if (existingUser) {
    res.status(401);
    throw new Error("User has already existed!");
  }
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  //   console.log("hashedPassword", hashedPassword);
  const newUser = new UserModel({
    fullname: fullname ?? "",
    email: email,
    password: hashedPassword,
  });
  await newUser.save();
  res.status(200).json({
    statusCode: 200,
    message: "Register new user successfully",
    data: {
      id: newUser.id,
      email: newUser.email,
      accessToken: await getJsonWebToken(email, newUser.id),
    },
  });
});
module.exports = {
  register,
};

const getJsonWebToken = async (email, id) => {
  //   console.log("email, id", email, id);
  const payload = { email, id };
  const token = jwt.sign(payload, process.env.SECRET_KEY, {
    expiresIn: "7d",
  });
  return token;
};
