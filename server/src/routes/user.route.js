import { Router } from "express";
import {registerUser, loginUser, logOutUser, refreshAccessToken, changePassword, getCurrentUser, updateAccountDetails, updateAvatar, updateCoverImage, getUserChannelProfile, getUserWatchHistory} from "../controllers/user.controller.js"
import {verifyJwt} from "../middleware/auth.middleware.js"
import {upload} from "../middleware/multer.middleware.js"

const router = Router()

router.route("/register").post(
    upload.fields([
        {name: "avatar", maxCount: 1},
        {name: "coverImage", maxCount: 1}
    ]),
    registerUser
)
router.route("/login").post(loginUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/logout").post(verifyJwt, logOutUser)
router.route("/change-password").post(verifyJwt, changePassword)
router.route("/current-user").get(verifyJwt, getCurrentUser)
router.route("/update-account").patch(verifyJwt, updateAccountDetails)
router.route("/avatar").patch(verifyJwt, upload.single("avatar"), updateAvatar)
router.route("/cover-image").patch(verifyJwt, upload.single("coverImage"), updateCoverImage)
router.route("/c/:username").get(verifyJwt, getUserChannelProfile)
router.route("/history").get(verifyJwt, getUserWatchHistory)

export default router