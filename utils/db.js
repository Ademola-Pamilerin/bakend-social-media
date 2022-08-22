const mongoose = require("mongoose")
const MONGODB_CONNECTION_STRING = "mongodb://127.0.0.1:27017/User";
const database = async () => {
    return await mongoose.connect(MONGODB_CONNECTION_STRING)
        .then((data, err) => {
            console.log("connected to database")
        })
}
module.exports = database