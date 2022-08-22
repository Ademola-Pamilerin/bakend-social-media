const express = require("express")
const Authorize = require("../middleware/auth")
const PostController = require("../controller/post-controller")


const route = express.Router()

//create new Post
route.post("/new", Authorize, PostController.createPost)
//update post
route.put("/:id", Authorize, PostController.editPost)

//delete Post
route.delete("/:id", Authorize, PostController.deletePost)

//getPost
route.get("/post", Authorize, PostController.readAllPost)

//get Single Post

route.get("/post/:id", Authorize, PostController.readSinglePost)

//react to post
route.put("/post/:id", Authorize, PostController.reactToPostPost)




module.exports = route