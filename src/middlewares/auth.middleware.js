
// src/middlewares/auth.middleware.js
import { asyncHandler } from "../utils/async-handler.js";
import { UserTable } from "../models/user.models.js";
import { ApiError } from "../utils/api-error.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  // Check for token in authorization header first
  const authHeader = req.headers.authorization;
  let token;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else {
    // If not in header, check for token in cookies
    token = req.cookies?.accessToken;
  }

  if (!token) {
    throw new ApiError(401, "Access token is missing");
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await UserTable.findById(decoded._id).select(
      "-password -refreshToken -forgetpasswordtoken -forgetpasswordtokenexpiry -emailverificationtoken -emailverificationtokenexpiry"
    );

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new ApiError(401, "Invalid access token");
    } else if (error.name === 'TokenExpiredError') {
      throw new ApiError(401, "Access token expired");
    } else {
      throw new ApiError(401, error.message || "Invalid or expired access token");
    }
  }
});


