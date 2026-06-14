import { Router } from "express";
import {createPlaylist, getUsersPlaylist, getPlaylistById, addVideoToPlaylist, removeVideoFromPlaylist, deletePlaylist, updatePlaylist} from "../controllers/playlist.controller.js"
import {verifyJwt} from "../middleware/auth.middleware.js"

const router = Router()

router.use(verifyJwt)

router.route('/').post(createPlaylist)
router.route("/user/:userId").get(getUsersPlaylist)
router.route("/:playlistId")
.get(getPlaylistById)
.patch(updatePlaylist)
.delete(deletePlaylist)

router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist)
router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist)

export default router