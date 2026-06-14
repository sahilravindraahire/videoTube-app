import mongoose, {isValidObjectId} from "mongoose"
import {Subscription} from "../models/subscription.model.js"
import {ApiError} from "../utils/apiError.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asynchandler.js"

export const toggleSubscription = asyncHandler(async(req, res) => {
    const {channelId} = req.params

    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "invalid channel id")
    }

    const subscriberId = req.user?._id

    if(!subscriberId){
        throw new ApiError(401, "unauthorized req, subscriber id does't match")
    }

    if(subscriberId.toString() === channelId){
        throw new ApiError(400, "you cannot subscribe to yourself")
    }

    // only need one matching document
    const existingSubscriber = await Subscription.findOne({
        subscriber: subscriberId,
        channel: channelId
    })

    if(existingSubscriber){
        await Subscription.findByIdAndDelete(existingSubscriber._id)

        return res
        .status(200)
        .json(new ApiResponse(200, {}, "unsubscribed successfully"))
    }

    await Subscription.create({
        subscriber: subscriberId,
        channel: channelId
    })

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "subscribed successfully"))
})

export const getUserChannelSubscriber = asyncHandler(async(req, res) => {
    const {channelId} = req.params

    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "invalid channel id")
    }

    const subscribers = await Subscription.find({channel: channelId})
    .populate("subscriber", "username email avatar")

    return res
    .status(200)
    .json(new ApiResponse(200, {
        totalSubscribers: subscribers.length,
        subscribers
    }, "subscribers fetched successfully"))
})

export const getSubscribedChannels = asyncHandler(async(req, res) => {
    const {subscriberId} = req.params

    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400, "invalid subscriber id")
    }

    const subscribedChannels = await Subscription.find({subscriber: subscriberId})
    .populate("channel", "username email avatar")

    return res
    .status(200)
    .json(new ApiResponse(200, {
        totalSubscribedChannels: subscribedChannels.length,
        subscribedChannels
    }, "subscribed channel fetched"))
})