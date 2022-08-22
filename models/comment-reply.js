const mongoose = require("mongoose")

const Schema = mongoose.Schema

const CommentReplySchema = new Schema({
    posts_id: {
        type: Schema.Types.ObjectId,
        ref: "Posts"
    },
    comment_id: {
        type: Schema.Types.ObjectId,
        ref: "Comments"
    },
    reply_comment_id: {
        type: Schema.Types.ObjectId,
        ref: "Comments"
    },
    message: {
        type: String,
        required: true
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
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
})

const CommentReplyModel = mongoose.model("ReplyComment", CommentReplySchema)
module.exports = CommentReplyModel