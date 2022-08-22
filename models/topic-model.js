const mongoose = require("mongoose")
const Schema = mongoose.Schema

const topicSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    posts: {
        type: []
    },
    number: {
        type: Number
    },
    people: {
        type: []
    },
    trending: {
        type: Boolean,
        default: false
    },
    location: {
        type: String
    }
}, {
    timestamps: true
})

const TopicModel = mongoose.model("Topics", topicSchema)
module.exports = TopicModel