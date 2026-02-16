import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const UserSchema = new Schema(
  {
    avatar: {
      type: {
        url: String,
      },
      default: {
        url: "https://placehold.co/200x200",
      },
    },
    username: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullname: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
    },
    forgetpasswordtoken: {
      type: String,
    },
    forgetpasswordtokenexpiry: {
      type: Date,
    },
    emailverificationtoken: {
      type: String,
    },
    emailverificationtokenexpiry: {
      type: Date,
    },
  },
  { timestamps: true },
);

// ---------------------------------------pre-hooks---------------//

UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 10);
});

//---------------------------methods------------------//
// Compare the provided password with the hashed password in the database
UserSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// ------------------------------------------------Generate JWT access token
UserSchema.methods.generateAccessToken = function () {
  const payload = {
    _id: this._id,
    email: this.email,
    username: this.username,
  };

  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
  });
};

// ------------------------------------------------Generate JWT refresh token
UserSchema.methods.generateRefreshToken = function () {
  const payload = {
    _id: this._id,
  };
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
  });
};

//--------------------------temporary token for email verification and password reset------------------//

UserSchema.methods.generateTemporaryToken = function () {
  const unHashedToken = crypto.randomBytes(20).toString("hex");

  const hashedToken = crypto
    .createHash("sha256")
    .update(unHashedToken)
    .digest("hex");

  const tokenExpiry = Date.now() + 20 * 60 * 1000; // Token expires in 20 minutes

  return { unHashedToken, hashedToken, tokenExpiry }; // Return both the unhashed token (for sending to the user) and the hashed token (for storing in the database) along with the expiry time
};

const UserTable = mongoose.model("User", UserSchema);

export { UserTable };
