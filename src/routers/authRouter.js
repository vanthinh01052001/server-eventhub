const Router = require("express");
const {
  register,
  login,
  verification,
  forgotPassword,
  handleLoginWithGoogle,
  handleLoginWithFacebook,
} = require("../controllers/authController");
const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/verification", verification);
authRouter.post("/forgotPassword", forgotPassword);
authRouter.post("/google-signin", handleLoginWithGoogle);
authRouter.post("/facebook-signin", handleLoginWithFacebook);
module.exports = authRouter;
