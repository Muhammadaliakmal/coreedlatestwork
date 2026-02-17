// src\routes\auth.routes.js
import express from "express";
import {
  registerUser,
  login,
  verifyEmail,
  logoutUser,
  resendEmailVerification,
  getCurrentUser,
  refreshAccessToken,
  forgetPasswordRequest,
  resetPassword,
  updateUser
} from "../controllers/auth.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = express.Router();

// localhost:8000/api/v1/auth/register = signup route
router.route("/register").post(registerUser); // user registration route


router.route("/verify-email/:verificationToken").get(verifyEmail); // email verification route

router.route("/resend-verification-email").get(resendEmailVerification); // resend email verification route

router.route("/login").post(login); // user login route

router.route("/logout").post(verifyJWT,logoutUser); // user logout route

// Current user route to get details of currently logged in user using access token which is set in cookie after login and verified in auth middleware.
router.route("/current-user").post(verifyJWT,getCurrentUser);

router.route("/refresh-token").post(refreshAccessToken);// refresh access token route

router.route("/forget-password").post(forgetPasswordRequest); // forget password route

router.route("/reset-password/:resetToken").get(resetPassword); // reset password route (GET for email link)

router.route("/update-user").post(verifyJWT, updateUser); // update user route

export default router;
