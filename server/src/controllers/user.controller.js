import {User} from "../models/user.model.js"
import {ApiError} from "../utils/apiError.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asynchandler.js"
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js"
import {Subscription} from "../models/subscription.model.js"
import bcrypt from "bcrypt"
import jwt, { decode } from "jsonwebtoken"
import mongoose from "mongoose"

const generateAccessAndRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
    
        user.refreshToken = refreshToken
    
        await user.save({validateBeforeSave: false})
    
        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "something went wrong while generating access and refresh token")
    }
}

const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
}

export const registerUser = asyncHandler(async(req, res) => {
    const {username, fullName, email, password} = req.body

    if(
        [username,, fullName, email, password].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "all fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })

    if(existedUser){
        throw new ApiError(402, "user already exists");
    }

    const avatarFile = req.files?.avatar?.[0]?.path
    let avatarPublicId

    const coverImageFile = req.files?.coverImage?.[0]?.path

    const avatarUpload = await uploadOnCloudinary(avatarFile)

    if(!avatarUpload){
        throw new ApiError(404,"something went wrong while uploading avatar on cloudinary")
    }

    const coverImageUpload = await uploadOnCloudinary(coverImageFile)

    if(!coverImageUpload){
        throw new ApiError(404,"something went wrong while uploading coverImage on cloudinary")
    }

    avatarPublicId = avatarUpload.public_id

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await User.create({
        username: username.toLowerCase(),
        avatar: avatarUpload.secure_url,
        avatarPublicId,
        coverImage: coverImageUpload.secure_url || "",
        coverImagePublicId: coverImageUpload.public_id || "",
        fullName,
        email,
        password: hashedPassword
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if(!createdUser){
        throw new ApiError(500, "something went wrong while registration")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, createdUser, "user created successfully"))
})

export const loginUser = asyncHandler(async(req, res) => {
    const {email, username, password} = req.body

    if(!username || !email){
        throw new ApiError(402, "Username or email is required")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiError(401, "user not found");
    }

    const passwordCheck = await bcrypt.compare(password, user.password)

    if(!passwordCheck){
        throw new ApiError(404, "Invalid password");
    }

    const {refreshToken, accessToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,
                accessToken,
                refreshToken
            },
            "user loggedin successfully"
        )
    )
})

export const logOutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {returnDocument: "after"}
    )

    return res
    .status(200)
    .cookie("accessToken", cookieOptions)
    .cookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "user logged out successfully"))
})

export const refreshAccessToken = asyncHandler(async(req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "unauthorized request");
    }

    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(decodedToken?._id)

    if(!user){
        throw new ApiError(403, "invalid refresh token");
    }

    if(incomingRefreshToken !== user?.refreshToken){
        throw new ApiError(401, "refresh token is already used or expired");
    }

    const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)

    return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", newRefreshToken, cookieOptions)
    .json(new ApiResponse(
        200,
        {
            accessToken,
            refreshToken: newRefreshToken
        },
        "access token refreshed"
    ))
})

export const changePassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword, confirmPassword} = req.body

    const user = await User.findById(req.user._id)

    const isPasswordCorrect = await bcrypt.compare(oldPassword, user.password)

    if(!isPasswordCorrect){
        throw new ApiError(401, "Incorrect password");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    user.password = hashedPassword
    await user.save({validateBeforeSave: false})

    if(newPassword !== confirmPassword){
        throw new ApiError(401, "new password and confirm password should be the same")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})

export const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(200, req.user._id, "user fetched successfully"))
})

export const updateAccountDetails = asyncHandler(async(req, res) => {
    const {email, fullName} = req.body

    if(!email || !fullName){
        throw new ApiError(401, "all fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {email, fullName}
        },
        {returnDocument: "after"}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Details changed successfully"))
})

export const updateAvatar = asyncHandler(async(req, res) => {
    const avtarFile = req.file?.path

    if(!avtarFile){
        throw new ApiError(401, "avatar file is not avalable");
    }

    const user = await User.findById(req.user._id)

    if(!user){
        throw new ApiError(404, "user not found")
    }

    if(user.avatarPublicId){
        await deleteFromCloudinary(user.avatarPublicId)
    }

    const avatarUpload = await uploadOnCloudinary(avtarFile)

    if(!avatarUpload){
        throw new ApiError(401, "something went wrong while updating new avatar");
    }

    user.avatar = avatarUpload.secure_url
    user.avatarPublicId = avatarUpload.public_id

    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, user, "avatar updated successfully"))
})

export const updateCoverImage = asyncHandler(async(req, res) => {
    const coverImageFile = req.file?.path

    if(!coverImageFile){
        throw new ApiError(401, "coverImage is not available")
    }

    let user = await User.findById(req.user._id)

    if(!user){
        throw new ApiError(404, "user not found")
    }

    if(user.coverImagePublicId){
        await deleteFromCloudinary(user.coverImagePublicId)
    }

    const coverImageUpload = await uploadOnCloudinary(coverImageFile)

    if(!coverImageFile){
        throw new ApiError(401, "something went wrong while updating new coverImage")
    }

    user.coverImage = coverImageUpload.secure_url
    user.coverImagePublicId = coverImageUpload.public_id

    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, user, "coverImage updated successfully"))
})

export const getUserChannelProfile = asyncHandler(async(req, res) => {
    const {username} = req.params

    if(!username?.trim()){
        throw new ApiError(400, "username is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username.trim().toLowerCase()
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscriberCount: {
                    $size: "$subscribers"
                },
                channelSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1, 
                username: 1,
                subscriberCount: 1,
                channelSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])

    if(!channel.length){
        throw new ApiError(404, "channel does't exists");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "user channell fetched successfully"))
})

export const getUserWatchHistory = asyncHandler(async(req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $addFields: {
                                        owner: {
                                            $first: "$owner"
                                        }
                                    }
                                },
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, user[0].watchHistory, "watch history fetched successfully"))
})