const express = require("express")
const UserController = require("../controller/user-controller")
const route = express.Router()
const { check } = require("express-validator")
const UserModel = require("../models/user-model")
const Auth = require("../middleware/auth")

route.post("/auth/sign-up", [
    check("firstname").notEmpty().withMessage({ field: "firstname", message: "Field firstname is empty" }),
    check("lastname").notEmpty().withMessage({ field: "lastname", message: "Field lastname is empty" }),
    check("email").notEmpty().withMessage({ field: "email", message: "Field email is empty" })
        .isEmail().withMessage({ field: "email", message: "Not a valid Email Address" })
        .custom(async (val, { req }) => {
            const user = await UserModel.findOne({ email: val })
            if (user) {
                const error = new Error("User with Email Already exist, please choose a new one")
                error.field = "email"
                throw error
            }
            else {
                return true
            }
        }),
    check("password").notEmpty().withMessage({ field: "password", message: "Field Password is empty" }).
        isStrongPassword().withMessage({ field: "password", message: "Password is not a strong password" })
], UserController.SignUp)


route.post("/auth/login", [
    check("email").notEmpty().withMessage({ field: "email", message: "Field email is empty" })
        .isEmail().withMessage({ field: "email", message: "Not a valid Email Address" })
        .custom(async (val, { req }) => {
            const user = await UserModel.findOne({ email: val })
            if (!user) {
                const error = new Error("Invalid Email or password")
                error.field = "email"
                throw error
            }
            else {
                return true
            }
        }),
    check("password").notEmpty().withMessage({ field: "lastname", message: "Field Password is empty" })
], UserController.Login)


route.post("/auth/send-verification", [
    check("email").notEmpty().withMessage({ field: "email", message: "Field email is required" })
        .isEmail().withMessage({ field: "email", message: "Email is not a valid Email Address" })
        .custom(async (val, { req }) => {
            const user = await UserModel.findOne({ email: val })
            if (!user) {
                const error = new Error("Account with Email not found")
                error.field = "email"
                throw error
            }
            return true
        })
], UserController.sendVerification)


route.put("/auth/reset-password", Auth, [
    check("password").notEmpty().withMessage({ field: "password", message: "Password field cannot be empty" })
        .isStrongPassword().withMessage({ field: "password", message: "must be a strong password" })
        .custom((val, { req }) => {
            if (val !== req.body.confirm_password) {
                const error = new Error("Passwords are not equal")
                error.field = "password"
                throw error
            }
            return true
        }),
    check("confirm_password").custom((val, { req }) => {
        if (val !== req.body.password) {
            const error = new Error("Passwords are not equal")
            error.field = "password"
            throw error
        }
        return true
    })
], UserController.UpdatePassword)

route.put("/auth/verify", [
    check("number").isEmpty().withMessage({ field: "password", message: "Password field cannot be empty" })
], UserController.verify_user)

route.put("/auth/forgotten-password", [
    check("email").notEmpty().withMessage({ field: "email", message: "Field email is required" })
        .isEmail().withMessage({ field: "email", message: "Email is not a valid Email Address" })
        .custom(async (val, { req }) => {
            const user = await UserModel.findOne({ email: val })
            if (!user) {
                const error = new Error("Account with Email not found")
                error.field = "email"
                throw error
            }
            return true
        })
], UserController.sendForgottenPasswordVerificatioMail)


route.post("/auth/forgotten-password", [
    check("password").notEmpty().withMessage({ field: "password", message: "Password field cannot be empty" })
        .isStrongPassword().withMessage({ field: "password", message: "Password must be a strong password" })
        .custom((val, { req }) => {
            if (!(val === req.body.confirm_password)) {
                const error = new Error("Passwords not equal")
                error.field = "password"
                throw error
            }
            return true
        }),
    check("confirm_password").custom((val, { req }) => {
        if (!(val === req.body.password)) {
            const error = new Error("Passwords not equal")
            error.field = "confirm_password"
            throw error
        }
        return true
    })
], UserController.forgottenPasswordHandler)


route.get("/auth/verify-forgotten-password", UserController.forgottenPasswordVerification)


route.put(
    "/auth/profile-upload",
    Auth,
    UserController.uploadProfileImage
);


route.put(
    "/auth/cover-upload",
    Auth,
    UserController.uploadCoverImage
);

route.get("/auth/trending", Auth, UserController.checkTrending)

route.put("/auth/follow-topics", Auth, [
    check("name").notEmpty().withMessage({ field: "name", message: "Can't complete request" })
], UserController.followTopics)

route.get("/auth/follow", Auth, UserController.follow)

route.put("/auth/update-me", Auth, [
    check("username").notEmpty().withMessage({ field: "username", message: "Username field can't be empty" })
        .custom(async (val, { req }) => {
            let text = /^[0-9+a-zA-Z+_]*$/
            const testRes = text.test(val)
            if (val.length < 6) {
                const error = new Error("Username too short")
                error.field = "username"
                throw error
            }
            if (val.length > 10) {
                const error = new Error("Username too long")
                error.field = "username"
                throw error
            }
            if (testRes === false) {
                const error = new Error("Only _ is allowed, other as special chracter are not allowed")
                error.field = "username"
                throw error
            }
            const user = await UserModel.findOne({ username: val })
            if (user) {
                const error = new Error("Username Already exits, please choose a new one")
                error.field = "username"
                throw error
            }
            else {
                return true
            }
        })

], UserController.updateUser)


route.get("/auth/user", Auth, UserController.fetchUserTags)


route.get("/auth/topics", Auth, UserController.fetchTopicTags)

module.exports = route

