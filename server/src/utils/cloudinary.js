import dotenv from "dotenv"
dotenv.config()

import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

export const uploadOnCloudinary = async(file) => {
    try {
        if(!file) return
        const response = await cloudinary.uploader.upload(file, {resource_type: "auto"})
        fs.unlinkSync(file)
        return response
    } catch (error) {
        console.log("Cloudinary error: ", error.message)
        if(fs.existsSync(file)){
            fs.unlinkSync(file)
        }
        return null
    }
}

export const deleteFromCloudinary = async(publicId) => {
    try {
        if(!publicId) return
        const response = await cloudinary.uploader.destroy(publicId, {resource_type: "video"})
        return response
    } catch (error) {
        console.log("error while deleting from cloudinary:", error.message)
    }
}