import mongoose, { Schema } from "mongoose";

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

const UserTable = mongoose.model("User", UserSchema);

export { UserTable };
