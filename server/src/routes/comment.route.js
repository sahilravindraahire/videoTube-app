import {Router} from "express"
import {getVideoComments, addComments, updateComment, deleteComment} from "../controllers/comment.controller.js"
import {verifyJwt} from "../middleware/auth.middleware.js"

const router = Router()

router.use(verifyJwt)

router.route("/:videoId").get(getVideoComments).post(addComments)
router.route("/c/:commentId").patch(updateComment).delete(deleteComment)

export default router