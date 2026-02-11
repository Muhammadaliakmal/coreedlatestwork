//src\controllers\auth.controllers.js
import { ApiResponse } from "../utils/api-response.js"
import { asyncHandler } from "../utils/async-handler.js"
import {ApiError} from "../utils/api-error.js"
import {UserTable} from "../models/user.models.js"
import { SendEmail } from "../utils/mail.js"
import Mailgen from "mailgen"

const registerUser = asyncHandler( async (req,res)=>{
    //getting data from client
    const {email,username,password} = req.body 

    // checking if user already exists
    const existingUser = await UserTable.findOne({
        $or:[{email},{username}]

    })
    // if user exits throw error
    if(existingUser){
        throw new ApiError(400,"User already exists")
    
    }

    // if user does not exist create new user
    const newUser = await UserTable.create({
        email,
        username,
        password,
        isEmailVerified:false,
    })

    // send response to client
    const {unHashedToken, hashedToken, tokenExpiry} = newUser.generateTemporaryToken()
    newUser.emailverificationtoken = hashedToken
    newUser.emailverificationtokenexpiry = tokenExpiry
    

    await newUser.save({validateBeforeSave:false})

    //sending email

    await SendEmail({
        email:newUser.email,
        subject:"plz verify your email",
        MailgenContent:emailVerificationMailGenContent(newUser.username,
            `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`
        
        )

    })
    
    // excluding fields from db
   const createdUser = await newUser.findById(newUser._id).select("-password -refreshToken -emailverificationtoken -emailverificationtokenexpiry")

// if user creation failed

   if(!createdUser){
    throw new ApiError(500,"User registration failed")
   
   }

   // sending response to client

   return res.status(201).json(
    new ApiResponse(200,createdUser,"User registered successfully")
   )
})


export {registerUser}




