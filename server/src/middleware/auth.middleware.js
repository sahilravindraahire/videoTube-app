import {User} from "../models/user.model.js"
import {ApiError} from "../utils/apiError.js"
import {asyncHandler} from "../utils/asynchandler.js"
import jwt from "jsonwebtoken"

export const verifyJwt = asyncHandler(async(req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    
        if(!token){
            throw new ApiError(401, "unauthorized request")
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECERET)
    
        const user = await User.findById(decodedToken?._id).select("-refreshToken -password")
    
        if(!user){
            throw new ApiError(401, "invalid access token")
        }
    
        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "invalid access token")
    }
})