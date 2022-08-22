const mongoose = require("mongoose")
const Schema = mongoose.Schema

const UserSchema = new Schema({
    firstname: {
        type: String,
        required: true,
        minLength: 3,
        maxLength: 20
    },
    lastname: {
        type: String,
        required: true,
        minLength: 3,
        maxLength: 20
    },
    username: {
        type: "String",
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,

    },
    profileimage: {
        type: String
    },
    coverimage: {
        type: String
    },
    verified: {
        type: Boolean,
        default: false
    },
    followers: [
        {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    following: [
        {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    posts: [
        {
            type: Schema.Types.ObjectId,
            ref: "Posts"
        }
    ],
    contact: {
        type: String,
    },
    address: {
        type: String,
    },
    country: {
        type: String,
    },
    state: {
        type: String,
    },
    token: {
        type: Schema.Types.ObjectId,
        ref: "Token"
    },
    verify_no: {
        type: String,
        required: true
    },
    followtopics: {
        type: []
    },
    showdetails: {
        type: Boolean
    },
    info: {
        type: String
    },
    notifications: [
        {
            message: {
                type: "String",
                required: true
            },
            viewed: {
                type: Boolean,
                default: false
            }
        }
    ],
    Postreactions: [
        {
            postId: {
                type: Schema.Types.ObjectId,
                ref: "Posts"
            },
            reaction: {
                type: String,
                enums: ["like", "love", "haha", "hate", "thumbsdown"],
                default: "like"
            }
        }
    ]
}, {
    timestamps: true,
})

const UserModel = mongoose.model("User", UserSchema)
module.exports = UserModel