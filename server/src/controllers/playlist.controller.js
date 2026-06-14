import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/apiError.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asynchandler.js"

export const createPlaylist = asyncHandler(async(req, res) => {
    const {name, description} = req.body

    if(!name.trim() || !description.trim()){
        throw new ApiError(400, "name and description are required")
    }

    const playlist = await Playlist.create({
        name: name.trim(),
        description: description.trim(),
        owner: req.user._id
    })

    if(!playlist){
        throw new ApiError(400, "error while creating playlist")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, playlist, "playlist created successfully"))
})

export const getUsersPlaylist = asyncHandler(async(req, res) => {
    const {userId} = req.params

    if(!isValidObjectId(userId)){
        throw new ApiError(400, "invalid user id")
    }

    const playlist = await Playlist.find({owner: userId})
    .populate("videos", "title thumbnail duration")
    .sort({createdAt: -1})

    return res
    .status(200)
    .json(new ApiResponse(200, playlist, "user playlist fetched successfully"))
})

export const getPlaylistById = asyncHandler(async(req, res) => {
    const {playlistId} = req.params

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "invalid playlist id")
    }

    const playlist = await Playlist.findById(playlistId)
    .populate("videos")
    .populate("owner", "username email avatar")

    if(!playlist){
        throw new ApiError(404, "playlist not found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, playlist, "playlist fetched successfully"))
})

export const addVideoToPlaylist = asyncHandler(async(req, res) => {
    const {playlistId, videoId} = req.params

    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(400, "invalid id")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404, "playlist not found")
    }

    if(playlist.owner.toString() !== req.user._id.toString()){
        throw new ApiError(400, "you are not allowed to add video to this playlist")
    }

    if(playlist.videos.includes(videoId)){
        throw new ApiError(400, "video already exist in playlist")
    }

    playlist.videos.push(videoId)
    await playlist.save()

    return res
    .status(200)
    .json(new ApiResponse(200, "video added successfully"))
})

export const removeVideoFromPlaylist = asyncHandler(async(req, res) => {
    const {playlistId, videoId} = req.params

    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(400, "invalid id")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(400, "playlist not found")
    }

    if(playlist.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "you are not allowed to remove video from playlist")
    }

    playlist.videos = playlist.videos.filter(
        (video) => video.toString() !== videoId
    )

    await playlist.save()

    return res
    .status(200)
    .json(new ApiResponse(200, playlist, "video removed from playlist"))
})

export const deletePlaylist = asyncHandler(async(req, res) => {
    const {playlistId} = req.params

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "invalid playlist id")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404, "playlist not found")
    }

    if(playlist.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "you are not allowed to delete this playlist")
    }

    await playlist.deleteOne()

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "playlist deleted successfully"))
})

export const updatePlaylist = asyncHandler(async(req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "invalid playlist id")
    }

    if(!name.trim() || !description.trim()){
        throw new ApiError(400, "name or description is required to update playlist")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404, "playlist not found")
    }

    if(playlist.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "not allowed to update this playlist")
    }

    if(name) playlist.name = name.trim()
    if(description) playlist.description = description.trim()

    await playlist.save()

    return res
    .status(200)
    .json(new ApiResponse(200, playlist, "playlist updated successfully"))
})