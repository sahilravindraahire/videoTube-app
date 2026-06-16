import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asynchandler.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

export const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;

  const matchStage = { isPublished: true };

  if (query) {
    matchStage.title = { $regex: query, $options: "i" };
  }

  if (userId && isValidObjectId(userId)) {
    matchStage.owner = new mongoose.Types.ObjectId(userId);
  }

  const sortOrder = sortType === "asc" ? 1 : -1;

  const aggregate = Video.aggregate([
    {
      $match: matchStage,
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    { $unwind: "$owner" },
    { $sort: { [sortBy]: sortOrder } },
  ]);

  const videos = await Video.aggregatePaginate(aggregate, {
    page: Number(page),
    limit: Number(limit),
  });

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "videos fetched successfully"));
});

export const publishVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!title?.trim() || !description?.trim()) {
    throw new ApiError(400, "title and description are required");
  }

  const videoFile = req.files?.videoFile?.[0]?.path;
  const thumbnailFile = req.files?.thumbnail?.[0]?.path;

  if (!videoFile || !thumbnailFile) {
    throw new ApiError(400, "video and thumbnail file are required");
  }

  const videoUpload = await uploadOnCloudinary(videoFile);
  const thumbnailUpload = await uploadOnCloudinary(thumbnailFile);

  if (!videoUpload || !thumbnailUpload) {
    throw new ApiError(500, "error while uploading video and thumbnail");
  }

  const video = await Video.create({
    title: title.trim(),
    description: description.trim(),
    videoFile: videoUpload.secure_url,
    videoPublicId: videoUpload.public_id,
    thumbnailFile: thumbnailUpload.secure_url,
    thumbnailPublicId: thumbnailUpload.public_id,
    duration: videoUpload.duration || 0,
    owner: req.user._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, video, "video published successfully"));
});

export const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "invalid video id");
  }

  const video = await Video.findById(videoId).populate(
    "owner",
    "username fullName avatar",
  );

  if (!video) {
    throw new ApiError(404, "video not found");
  }

  video.views += 1;
  await video.save();

  return res
    .status(200)
    .json(new ApiResponse(200, video, "video fetched successfully"));
});

export const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "invalid video id");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "video not found");
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "not authorized to update anything in this video");
  }

  if (title) video.title = title.trim();
  if (description) video.description = description.trim();

  const thumbnailFile = req.file?.path;

  if (thumbnailFile) {
    if (video.thumbnailPublicId) {
      await deleteFromCloudinary(video.thumbnailPublicId);
    }

    const thumbnailUpload = await uploadOnCloudinary(thumbnailFile);

    if (!thumbnailUpload) {
      throw new ApiError(500, "error while upolading thumbnail");
    }

    video.thumbnail = thumbnailUpload.secure_url;
    video.thumbnailPublicId = thumbnailUpload.public_id;
  }

  await video.save();

  return res
    .status(200)
    .json(new ApiResponse(200, video, "video updated successfully"));
});

export const deleteVideo = asyncHandler(async(req, res) => {
    const {videoId} = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "invalid video id")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "video not found")
    }

    if(video.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "not authorized")
    }

    const deleteVideoUrl = await deleteFromCloudinary(video.videoPublicId)
    const deleteThumbnailUrl = await deleteFromCloudinary(video.thumbnailPublicId)

    await video.deleteOne()

    return res 
    .status(200)
    .json(new ApiResponse(200, {}, "video deleted"))
})

export const togglePublishStatus = asyncHandler(async(req, res) => {
    const {videoId} = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "invalid video id")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "video not found")
    }

    video.isPublished = !video.isPublished

    await video.save()

    return res
    .status(200)
    .json(new ApiResponse(200, video, `video ${video.isPublished ? "published" : "notPublished"} successfully`))
})