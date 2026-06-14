import {Router} from "express"
import {getAllVideos, publishVideo, getVideoById, updateVideo, deleteVideo, togglePublishStatus} from "../controllers/video.controller.js"
import {verifyJwt} from "../middleware/auth.middleware.js"
import {upload} from "../middleware/multer.middleware.js"

const router = Router()

router.use(verifyJwt)

router.route("/")
.get(getAllVideos)
.post(
    upload.fields([
        {name: "videoFile", maxCount: 1},
        {name: "thumbnail", maxCount: 1}
    ]),
    publishVideo
)

router.route("/:videoId")
.get(getVideoById)
.patch(upload.single("thumbnail"), updateVideo)
.delete(deleteVideo)

router.route("/toggle/publish/:videoId").patch(togglePublishStatus)

export default router