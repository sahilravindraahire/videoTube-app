import mongoose, {isValidObjectId} from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {ApiError} from "../utils/apiError.js"
import {asyncHandler} from "../utils/asynchandler.js"

export const createTweet = asyncHandler(async(req, res) => {
    const {content} = req.body

    if(!content?.trim()){
        throw new ApiError(400, "tweet content is required")
    }

    const tweet = await Tweet.create({
        content: content.trim(),
        owner: req.user._id
    })

    if(!tweet){
        throw new ApiError(400, "error while creating tweet")
    }

    return res
    .status(200)
    .json(new ApiResponse(201, tweet, "tweet created successfully"))
})

export const getUserTweets = asyncHandler(async(req, res) => {
    const {userId} = req.params

    if(!isValidObjectId(userId)){
        throw new ApiError(400, "invalid user id")
    }

    const tweets = await Tweet.find({owner: userId})
    .populate("owner", "username fullName avatar")
    .sort({createAt: -1})

    return res
    .status(200)
    .json(new ApiResponse(200, tweets, "user tweets fetched successfully"))
})

export const updateTweet = asyncHandler(async(req, res) => {
    const {tweetId} = req.params
    const {content} = req.body

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "invalid tweet id")
    }

    if(!content?.trim()){
        throw new ApiError(400, "content can't be empty")
    }

    const tweet = await Tweet.findById(tweetId)

    if(!tweet){
        throw new ApiError(404, "tweet not found")
    }

    if(tweet.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "you're not allowed to update this tweet")
    }

    tweet.content = content.trim()
    await tweet.save()

    return res
    .status(200)
    .json(new ApiResponse(200, tweet, "tweet updated successfully"))
})

export const deleteTweet = asyncHandler(async(req, res) => {
    const {tweetId} = req.params

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "invalid tweet id")
    }

    const tweet = await Tweet.findById(tweetId)

    if(!tweet){
        throw new ApiError(404, "tweet not found")
    }

    if(tweet.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "you are not allowed to delete this tweet")
    }

    await tweet.deleteOne()

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "tweet deleted"))
})