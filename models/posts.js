const mongoose = require("mongoose")

constmongoose = require("mongoose")
const Schema = mongoose.Schema

const PostSchema = new Schema({
    author: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    caption: {
        type: "String"
    },
    tags: {
        type: []
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
    comments: {
        type: []
    },
    medialink: {
        type: []
    },
    disable_comment: {
        type: Boolean,
        default: false
    },
    love: {
        type: []
    },
    topics: {
        type: []
    },
    repostedby: {
        type: []
    }
}, {
    timestamps: true
})
const PostModel = mongoose.model("Posts", PostSchema)
module.exports = PostModel