const jwt = require("jsonwebtoken")



const createToken = (data) => {

    const token = jwt.sign(data, process.env.JWT_SECRET, {
        expiresIn: "2hr"
    })
    return token;
}

const verifyToken = (token, cb) => {
    jwt.verify(token, process.env.JWT_SECRET, (error, payload) => {
        return cb({ error, payload })
    })
}

module.exports = {
    createToken,
    verifyToken
}
