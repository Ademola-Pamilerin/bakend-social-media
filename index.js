const express = require("express")
const app = express();
require("dotenv").config()
const UserRoute = require("./routes/user-route")
const PostRoute = require("./routes/post-route")
const CommentRoute = require("./routes/comment-route")
const path = require("path")
const cors = require("cors")


app.use(express.json())
app.use(cors())


app.use("/images", express.static(path.join(__dirname)));
app.use("/user", UserRoute)
app.use("/post", PostRoute)
app.use("/comment", CommentRoute)

app.use((error, req, res, next) => {
    if (!error.status) {
        error.status = 500
    }
    res.status(error.status).json({ message: error.message })
})

app.listen(4000, async (err) => {
    if (err) {
        console.log("Error Occured")
        return
    }
    await require("./utils/db")()
    console.log("started on port " + 4000)
})