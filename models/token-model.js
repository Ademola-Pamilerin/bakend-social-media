const mongoose = require("mongoose")
const Schema = mongoose.Schema

const tokenSchema = new Schema({

    user: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    refreshtoken: {
        type: String
    },
    accesstoken: {
        type: String
    }

})

const TokenModel = mongoose.model("Token", tokenSchema)
module.exports = TokenModel