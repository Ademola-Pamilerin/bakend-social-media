const mongoose = require("mongoose")
const Schema = mongoose.Schema


const MediaSchema = new Schema({
    path: {
        type: String,
        required: true
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
}, {
    timestamps: true
})


const MediaModel = mongoose.model("Video", MediaSchema)
module.exports = MediaModel