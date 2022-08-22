const express = require("express")
const Authorize = require("../middleware/auth")
const PostController = require("../controller/post-controller")


const route = express.Router()

//comment on post
route.post("/:id", Authorize, PostController.commentPost)

//read post comment
route.get("/:id", Authorize, PostController.readPostComment)

//react to comment
route.put("/:id", Authorize, PostController.reactToComment)

//comment on a comment
route.post("/comment/:id", Authorize, PostController.commentToOfComment)

//react to a comment of comment
route.put("/comment/:id", Authorize, PostController.reactToCommentofComment)

//get comment of comments
route.get("/comment/:id", Authorize, PostController.getCommentOfComment)




module.exports = route