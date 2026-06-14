import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/apiError.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asynchandler.js"
import mongoose, {isValidObjectId} from "mongoose"

export const toggleVideoLike = asyncHandler(async(req, res) => {
    const {videoId} = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "invalid video id")
    }

    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: req.user._id
    })

    if(existingLike){
        await existingLike.deleteOne()
        return res
        .status(200)
        .json(new ApiResponse(200, {}, "video unliked"))
    }

    await Like.create({
        video: videoId,
        likedBy: req.user._id
    })

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "video liked"))
})

export const toggleCommentLike = asyncHandler(async(req, res) => {
    const {commentId} = req.params

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "invalid comment id")
    }

    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: req.user._id
    })

    if(existingLike){
        await existingLike.deleteOne()

        return res
        .status(200)
        .json(new ApiResponse(200, {}, "comment umliked"))
    }

    await Like.create({
        comment: commentId,
        likedBy: req.user._id
    })

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "comment liked"))
})

export const toggleTweetLike = asyncHandler(async(req, res) => {
    const {tweetId} = req.params

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "invalid tweet id")
    }

    const existingLike = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user._id
    })

    if(existingLike){
        await existingLike.deleteOne()
        return res

        .status(200)
        .json(new ApiResponse(200, {}, "tweet disliked"))
    }

    await Like.create({
        tweet: tweetId,
        likedBy: req.user._id
    })

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "tweet liked"))
})

export const getLikedVideos = asyncHandler(async(req, res) => {
    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user._id),
                video: {$ne: null}
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video"
            }
        },
        {$unwind: "$video"},
        {
            $project: {
                _id: 0,
                video: 1
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, likedVideos, "liked videos fetched successfully"))
})