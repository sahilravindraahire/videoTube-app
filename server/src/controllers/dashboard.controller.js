import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/apiError.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asynchandler.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"

export const getChannelStats = asyncHandler(async(req, res) => {
    const userId = req.user._id

    const totalVideos = await Video.countDocuments({owner: userId})

    const totalViewsResult = await Video.aggregate([
        {
            $match: {owner: new mongoose.Types.ObjectId(userId)}
        },
        {
            $group: {
                _id: null,
                totalViews: {$sum: "$views"}
            }
        }
    ])

    const totalViews = totalViewsResult[0]?.totalViews || 0
    
    const totalSubscriber = await Subscription.countDocuments({channel: userId})

    const totalLikeResult = await Like.aggregate([
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "owner"
            }
        },
        {$unwind: "$owner"},
        {
            $match: {
                "owner.owner": new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group: {
                _id: null,
                totalLikes: {$sum: 1}
            }
        }
    ])

    const totalLikes = totalLikeResult[0]?.totalLikes || 0

    return res
    .status(200)
    .json(new ApiResponse(200, {
        totalVideos, totalViews, totalSubscriber, totalLikes
    }, "channel stats fetched successfully"))
})

export const getChannelVideos = asyncHandler(async(req, res) => {
    const userId = req.user._id

    const videos = await Video.find({owner: userId})
    .sort({createdAt: -1})
    .select("-__v")

    return res
    .status(200)
    .json(new ApiResponse(200, videos, "channel video fetched successfully"))
})