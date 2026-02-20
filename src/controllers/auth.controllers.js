//src\controllers\auth.controllers.js
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { UserTable } from "../models/user.models.js";
import {
  SendEmail,
  emailVerificationMailGenContent,
  forgetPasswordMailGenContent,
} from "../utils/mail.js";
import crypto from "crypto";
import Jwt from "jsonwebtoken";

const registerUser = asyncHandler(async (req, res) => {
  //getting data from client
  const { email, username, password } = req.body;

  // Validate required fields
  if (!email || !username || !password) {
    throw new ApiError(400, "Email, username, and password are required");
  }

  // Clean up any existing user with the same email that might have old tokens
  await UserTable.updateMany(
    { email: email },
    {
      $unset: {
        emailverificationtoken: "",
        emailverificationtokenexpiry: "",
      },
    },
  );

  // checking if user already exists
  const existingUser = await UserTable.findOne({
    $or: [{ email }, { username }],
  });
  // if user exits throw error
  if (existingUser) {
    throw new ApiError(400, "User already exists");
  }

  // if user does not exist create new user
  const newUser = await UserTable.create({
    email,
    username,
    password,
    isEmailVerified: false, // Email verification required by default
  });

  // creating temporary token for email verification for 20 min
  const { unHashedToken, hashedToken, tokenExpiry } =
    newUser.generateTemporaryToken();

  console.log("Generated unhashed token:", unHashedToken); // Debug log
  console.log("Generated hashed token:", hashedToken); // Debug log
  console.log("Token expiry:", new Date(tokenExpiry)); // Debug log

  newUser.emailverificationtoken = hashedToken;
  newUser.emailverificationtokenexpiry = tokenExpiry;

  await newUser.save({ validateBeforeSave: false });

  try {
    //sending email
    console.log("Attempting to send email to:", newUser.email); // Debug log

    const verificationURL = `${req.protocol}://${req.get("host")}/api/v1/auth/verify-email/${unHashedToken}`;
    console.log("Verification URL being sent:", verificationURL); // Debug log

    await SendEmail({
      email: newUser.email,
      subject: "Please verify your email",
      mailgenContent: emailVerificationMailGenContent(
        newUser.username,
        verificationURL,
      ),
    });

    console.log("Email function called"); // Debug log
  } catch (emailError) {
    console.error("Failed to send verification email:", emailError);
    // Continue with registration even if email fails, but log the error
  }

  // excluding fields from db
  const createdUser = await UserTable.findById(newUser._id).select(
    "-password -refreshToken -emailverificationtoken -emailverificationtokenexpiry",
  );

  // if user creation failed
  if (!createdUser) {
    throw new ApiError(500, "User registration failed");
  }

  // sending response to client
  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        createdUser,
        "User registered successfully. Please check your email for verification.",
      ),
    );
});

const login = asyncHandler(async (req, res) => {
  // getting data from client
  const { email, password } = req.body;

  // Validate required fields
  if (!email) {
    throw new ApiError(400, "Email is required");
  }
  if (!password) {
    throw new ApiError(400, "Password is required");
  }

  // check if user exists in db
  const existingUser = await UserTable.findOne({ email });

  // if user does not exist, throw error
  if (!existingUser) {
    throw new ApiError(404, "User does not exist");
  }

  // check if password is correct
  const isPasswordCorrect = await existingUser.isPasswordCorrect(password);

  // if password is incorrect, throw error
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Incorrect password");
  }

  // generate access token and refresh token
  const accessToken = existingUser.generateAccessToken();
  const refreshToken = existingUser.generateRefreshToken();

  // save refresh token in db
  existingUser.refreshToken = refreshToken;
  await existingUser.save({ validateBeforeSave: false });

  // settings cookie options
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Only set secure in production
  };

  // Log tokens to server console for local debugging (don't log in production)
  if (process.env.NODE_ENV !== "production") {
    console.log("[DEBUG] accessToken:", accessToken);
    console.log("[DEBUG] refreshToken:", refreshToken);
  }

  // returning response to client with user details and tokens
  return res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: {
            _id: existingUser._id,
            username: existingUser.username,
            email: existingUser.email,
            isEmailVerified: existingUser.isEmailVerified, // Include email verification status
          },
          accessToken,
          refreshToken,
        },
        "User logged in successfully",
      ),
    );
});

const verifyEmail = asyncHandler(async (req, res) => {
  // getting verification token from params/url
  const { verificationToken } = req.params;

  console.log("Received verification token:", verificationToken); // Debug log

  // if not token is provided throw error
  if (!verificationToken) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Verification token is required"));
  }

  // hash the token to compare with db
  const hashedToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  console.log("Hashed token for comparison:", hashedToken); // Debug log

  try {
    // Find user with the hashed token and check if token is not expired
    let user = await UserTable.findOne({
      emailverificationtoken: hashedToken,
      emailverificationtokenexpiry: { $gt: Date.now() },
    });

    console.log("User found with valid token:", !!user); // Debug log

    // If no user found with valid token, check if token exists but is expired
    if (!user) {
      user = await UserTable.findOne({
        emailverificationtoken: hashedToken,
      });

      console.log("User found with expired token:", !!user); // Debug log

      // If user exists but token is expired, clean it up and return error
      if (user) {
        user.emailverificationtoken = undefined;
        user.emailverificationtokenexpiry = undefined;
        await user.save({ validateBeforeSave: false });

        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              null,
              "Verification token has expired. Please register again or request a new verification email.",
            ),
          );
      } else {
        // Token doesn't exist at all
        console.log("Token does not exist in database"); // Debug log
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              null,
              "Invalid or expired verification token. Please register again to get a new verification email.",
            ),
          );
      }
    }

    // Update user's email verification status
    user.isEmailVerified = true;
    user.emailverificationtoken = undefined;
    user.emailverificationtokenexpiry = undefined;
    // Save the updated user
    await user.save({ validateBeforeSave: false });

    console.log("Email verified successfully for user:", user.email); // Debug log

    // send response to client
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Email verified successfully😍"));
  } catch (error) {
    console.error("Error in verifyEmail:", error);
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          null,
          "Internal server error during email verification",
        ),
      );
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  // clearing refresh token from db
  await UserTable.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: "",
      },
    },
    {
      new: true,
    },
  );
  // options for clearing cookies
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Only set secure in production
  };
  // sending response to client and clearing cookies
  return res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200, null, "user logged out successfully"));
});

const resendEmailVerification = asyncHandler(async (req, res) => {
  // getting user from req.body
  const { email } = req.body;

  // Validate email is provided
  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  //find user with the provided email
  const user = await UserTable.findOne({ email });

  // if user not found throw error
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // if user is already verified send response to client
  if (user.isEmailVerified) {
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Email is already verified"));
  }

  // Clean up any existing verification token
  user.emailverificationtoken = undefined;
  user.emailverificationtokenexpiry = undefined;

  // creating temporary token for email verification for 20 min
  const { unHashedToken, hashedToken, tokenExpiry } =
    user.generateTemporaryToken();

  console.log("Generated unhashed token for resend:", unHashedToken); // Debug log
  console.log("Generated hashed token for resend:", hashedToken); // Debug log
  console.log("Token expiry for resend:", new Date(tokenExpiry)); // Debug log

  user.emailverificationtoken = hashedToken;
  user.emailverificationtokenexpiry = tokenExpiry;

  await user.save({ validateBeforeSave: false });

  try {
    //sending email
    console.log("Attempting to send verification email to:", user.email); // Debug log

    const verificationURL = `${req.protocol}://${req.get("host")}/api/v1/auth/verify-email/${unHashedToken}`;
    console.log("Verification URL being sent:", verificationURL); // Debug log

    await SendEmail({
      email: user.email,
      subject: "Please verify your email",
      mailgenContent: emailVerificationMailGenContent(
        user.username,
        verificationURL,
      ),
    });

    console.log("Verification email sent successfully"); // Debug log
  } catch (emailError) {
    console.error("Failed to send verification email:", emailError);
    // Continue with response even if email fails, but log the error
  }

  // sending response to client
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Verification email resent successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  // sending response to client with user details which is set in auth middleware after verifying access token.
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        req.user,
        "current user details fetched successfully",
      ),
    );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  // getting refresh token from cookies
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  // if no refresh token is provided throw error
  if (!incomingRefreshToken) {
    throw new ApiError(400, "Refresh token is required");
  }

  try {
    // verify the incoming refresh token from client to get _id of user
    const decodedToken = Jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    // find user from db
    const user = await UserTable.findById(decodedToken._id);

    // if user not found throw error
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // check if the incoming refresh token matches with the client in db
    if (user.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Invalid refresh token");
    }

    // generate new access token
    const newAccessToken = user.generateAccessToken();

    // settings cookie options
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };

    // send response to client with new access token
    return res
      .status(200)
      .cookie("accessToken", newAccessToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken: newAccessToken },
          "Access token refreshed successfully",
        ),
      );
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      throw new ApiError(401, "Invalid refresh token");
    } else if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Refresh token expired");
    } else {
      throw new ApiError(401, "Invalid refresh token");
    }
  }
});

const forgetPasswordRequest = asyncHandler(async (req, res) => {
  // getting email from client
  const { email } = req.body;

  // Validate email is provided
  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  // find user with the provided email
  const user = await UserTable.findOne({ email });

  // if user not found throw error
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Clean up any existing password reset token
  user.forgetpasswordtoken = undefined;
  user.forgetpasswordtokenexpiry = undefined;

  // creating temporary token for password reset for 20 min
  const { unHashedToken, hashedToken, tokenExpiry } =
    user.generateTemporaryToken();

  console.log("Generated unhashed token for password reset:", unHashedToken); // Debug log
  console.log("Generated hashed token for password reset:", hashedToken); // Debug log
  console.log("Token expiry for password reset:", new Date(tokenExpiry)); // Debug log

  user.forgetpasswordtoken = hashedToken;
  user.forgetpasswordtokenexpiry = tokenExpiry;

  await user.save({ validateBeforeSave: false });

  try {
    //sending email
    console.log("Attempting to send password reset email to:", user.email); // Debug log

    const resetURL = `${req.protocol}://${req.get("host")}/api/v1/auth/reset-password/${unHashedToken}`;
    console.log("Password reset URL being sent:", resetURL); // Debug log

    await SendEmail({
      email: user.email,
      subject: "Password Reset Request",
      mailgenContent: forgetPasswordMailGenContent(user.username, resetURL),
    });

    console.log("Password reset email sent successfully"); // Debug log
  } catch (emailError) {
    console.error("Failed to send password reset email:", emailError);
    // Continue with response even if email fails, but log the error
  }

  // sending response to client
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password reset email sent successfully"));
});

const updateUser = asyncHandler(async (req, res) => {
  const { username, email, fullname, password } = req.body;

  if (!username && !email && !fullname && !password) {
    throw new ApiError(400, "At least one field is required");
  }

  if (email) {
    const existing = await UserTable.findOne({
      email,
      _id: { $ne: req.user._id },
    });
    if (existing) throw new ApiError(400, "Email already in use");
  }

  if (username) {
    const existing = await UserTable.findOne({
      username,
      _id: { $ne: req.user._id },
    });
    if (existing) throw new ApiError(400, "Username already in use");
  }

  const updateFields = {};
  if (username) updateFields.username = username;
  if (email) updateFields.email = email;
  if (fullname) updateFields.fullname = fullname;
  if (password) updateFields.password = password;

  const updatedUser = await UserTable.findByIdAndUpdate(
    req.user._id,
    { $set: updateFields },
    { new: true },
  ).select(
    "-password -refreshToken -emailverificationtoken -emailverificationtokenexpiry",
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "User updated successfully"));
});

const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken } = req.params;

  console.log("=== PASSWORD RESET REQUEST ==="); // Debug log
  console.log("Request method:", req.method); // Debug log
  console.log("Received reset token:", resetToken); // Debug log

  // Handle GET request - validate token
  if (req.method === "GET") {
    // For GET request, just validate the token and return success/failure
    if (!resetToken) {
      throw new ApiError(400, "Password reset token is required");
    }

    // Hash the token to compare with db
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    console.log("Hashed reset token for comparison:", hashedToken); // Debug log

    // Find user with the hashed token and check if token is not expired
    const user = await UserTable.findOne({
      forgetpasswordtoken: hashedToken,
      forgetpasswordtokenexpiry: { $gt: Date.now() },
    });

    console.log("User found with valid reset token:", !!user); // Debug log

    if (!user) {
      // Check if token exists but is expired
      const expiredUser = await UserTable.findOne({
        forgetpasswordtoken: hashedToken,
      });

      console.log("User found with expired reset token:", !!expiredUser); // Debug log

      if (expiredUser) {
        // Clean up expired token
        expiredUser.forgetpasswordtoken = undefined;
        expiredUser.forgetpasswordtokenexpiry = undefined;
        await expiredUser.save({ validateBeforeSave: false });

        throw new ApiError(400, "Password reset token has expired");
      } else {
        throw new ApiError(400, "Invalid or expired password reset token");
      }
    }

    // Return a success response indicating the token is valid
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isValid: true, message: "Valid reset token" },
          "Password reset form can be shown",
        ),
      );
  }
  // Handle POST request - process the password reset
  else if (req.method === "POST") {
    const { newPassword } = req.body;

    console.log("New password provided:", newPassword ? "yes" : "no"); // Debug log

    if (!resetToken) {
      throw new ApiError(400, "Password reset token is required");
    }

    if (!newPassword) {
      throw new ApiError(400, "New password is required");
    }

    // Hash the token to compare with db
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    try {
      // Find user with the hashed token and check if token is not expired
      const user = await UserTable.findOne({
        forgetpasswordtoken: hashedToken,
        forgetpasswordtokenexpiry: { $gt: Date.now() },
      });

      if (!user) {
        // Check if token exists but is expired
        const expiredUser = await UserTable.findOne({
          forgetpasswordtoken: hashedToken,
        });

        if (expiredUser) {
          // Clean up expired token
          expiredUser.forgetpasswordtoken = undefined;
          expiredUser.forgetpasswordtokenexpiry = undefined;
          await expiredUser.save({ validateBeforeSave: false });

          throw new ApiError(400, "Password reset token has expired");
        } else {
          throw new ApiError(400, "Invalid or expired password reset token");
        }
      }

      // Update user's password
      user.password = newPassword;
      // Clear the reset token
      user.forgetpasswordtoken = undefined;
      user.forgetpasswordtokenexpiry = undefined;

      await user.save();

      console.log("Password reset successfully for user:", user.email); // Debug log

      return res
        .status(200)
        .json(new ApiResponse(200, null, "Password reset successfully"));
    } catch (error) {
      console.error("Error in resetPassword:", error);
      throw new ApiError(500, "Internal server error during password reset");
    }
  } else {
    throw new ApiError(405, "Method not allowed");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  // getting old and new password from req.body
  const { oldPassword, newPassword } = req.body;

  // find user from db
  const user = await UserTable.findById(req.user._id);

  // if user not found throw error
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // check if old password is correct
  const isOldPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  // if old password is incorrect, throw error
  if (!isOldPasswordCorrect) {
    throw new ApiError(401, "Incorrect old password");
  }

  // update user's password
  user.password = newPassword; //set new password
  await user.save({ validateBeforeSave: false });

  // send response to client
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password changed successfully"));
});

//-----------------------------------------------------exporting all controllers----------------------------------------------------------------------------//
export {
  registerUser,
  login,
  verifyEmail,
  logoutUser,
  resendEmailVerification,
  getCurrentUser,
  refreshAccessToken,
  forgetPasswordRequest,
  resetPassword,
  updateUser,
  changeCurrentPassword,
};
