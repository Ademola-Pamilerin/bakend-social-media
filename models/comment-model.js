const mongoose = require("mongoose")
const Schema = mongoose.Schema

const CommentSchema = new Schema({
    reactions: [
        {
            type_reaction: {
                type: String,
                enums: ["like", "love", "haha", "hate", "thumbsdown"],
                default: "like"
            },
            by: {
                type: Schema.Types.ObjectId,
                ref: "User"
            }
        }
    ],
    postId: {
        type: Schema.Types.ObjectId,
        ref: "Posts"
    },
    comment: {
        type: String,
        required: true
    },
    reply: {
        type: Schema.Types.ObjectId,
        ref: "ReplyComment"
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
})

const CommentModel = mongoose.model("Comments", CommentSchema)

module.exports = CommentModel