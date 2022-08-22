const { validationResult } = require("express-validator")
const UserModel = require("../models/user-model");
const bcrypt = require("bcrypt");
const { createToken } = require("../utils/token");
const crypto = require("crypto");
const TokenModel = require("../models/token-model");
const jwt = require("jsonwebtoken")
const path = require("path");
const deleteFile = require("../utils/file");
const multer = require("multer");
const fs = require("fs")
const fs2 = require("fs/promises");
const TopicModel = require("../models/topic-model");

const fileStorageProfile = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = "images/profile-images";
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        cb(null, dir);
    },
    filename: async (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    },
});

const fileStorageCover = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = "images/cover-images";
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {

        cb(null, Date.now() + "-" + file.originalname);
    },
});

const fileFilter = (req, file, cb) => {
    if (!file.mimetype.includes("image")) {
        const error = new Error("Can't upload, only image allowed");
        error.status = 405;
        cb(null, false);
    } else {
        cb(null, true);
    }
};

const uploadProfileImageMulter = multer({ storage: fileStorageProfile, fileFilter: fileFilter, }).single("image");
const uploadCoverImageMulter = multer({
    storage: fileStorageCover, fileFilter: fileFilter,
}).single("image");




const UserController = {
    SignUp: async (req, res, next) => {
        try {
            const { email, firstname, lastname, password } = req.body

            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                const errorVal = errors.errors
                const error = new Error(errors.errors[0].msg.message ? errors.errors[0].msg.message : errors.errors[0].msg)
                error.field = errors.errors[0].msg.field ? errors.errors[0].msg.field : errors.errors[0].param
                error.status = 403
                throw error
            }
            const saltRound = await bcrypt.genSalt(10)
            const hashedPassword = await bcrypt.hash(password, saltRound)
            const user = new UserModel({ email, firstname, lastname, password: hashedPassword, username: email.split("@")[0] })
            const token = createToken({ email: user.email, _id: user._id })
            const refreshTok = crypto.randomBytes(100).toString("hex")
            const verifNum = crypto.randomBytes(3.5).toString("hex")
            const TokenData = new TokenModel({ accesstoken: token, refreshtoken: refreshTok, user: user._id })
            user.verify_no = verifNum
            user.token = TokenData._id
            await TokenData.save()
            await user.save()
            res.status(200).json({ token, _id: user._id, refreshtoken: refreshTok, message: 'created a new Account' })
        }
        catch (error) {
            if (!error.status) {
                error.status = 500
            }
            if (error.field) {
                return res.status(error.status).json({ message: error.message, field: error.field })
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    Login: async (req, res, next) => {
        try {
            const { email, password } = req.body

            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                const errorVal = errors.errors
                const error = new Error(errors.errors[0].msg.message ? errors.errors[0].msg.message : errors.errors[0].msg)
                error.field = errors.errors[0].msg.field ? errors.errors[0].msg.field : errors.errors[0].param
                error.status = 403
                throw error
            }

            const user = await UserModel.findOne({ email })

            const confirmPass = await bcrypt.compare(password, user.password)
            if (!confirmPass) {
                const error = new Error("Invalid username or password")
                error.field = "password"
                throw error
            }
            const token = createToken({ email, _id: user._id })
            const refreshTok = crypto.randomBytes(100).toString("hex")
            const TokenData = await TokenModel.findByIdAndUpdate(user.token, { accesstoken: token, refreshtoken: refreshTok })
            await TokenData.save()
            res.status(200).json({ token, refreshtoken: refreshTok })
        } catch (error) {
            if (!error.status) {
                error.status = 500
            }
            if (error.field) {
                return res.status(error.status).json({ message: error.message, field: error.field })
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    sendVerification: async (req, res, next) => {
        try {
            const { email } = req.body
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                const error = new Error(errors.errors[0].msg.message ? errors.errors[0].msg.message : errors.errors[0].msg)
                error.field = errors.errors[0].msg.field ? errors.errors[0].msg.field : errors.errors[0].param
                error.status = 403
                throw error
            }
            const user = await UserModel.findOne({ email })
            const verifNum = crypto.randomBytes(4).toString("hex")
            user.verifyNo = verifNum
            await user.save();
            //send Mail
            res.status(200).json({ message: "Verification sent" })

        } catch (error) {
            if (!error.status) {
                error.status = 500
            }
            if (error.field) {
                return res.status(error.status).json({ messageg: error.message, field: error.field })
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    UpdatePassword: async (req, res, next) => {
        //update password when authenticated
        try {
            const { password } = req.body
            const user = await UserModel.findById(req.id)
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                const errorVal = errors.errors
                const error = new Error(errors.errors[0].msg.message ? errors.errors[0].msg.message : errors.errors[0].msg)
                error.field = errors.errors[0].msg.field ? errors.errors[0].msg.field : errors.errors[0].param
                error.status = 403
                throw error
            }
            if (!user) {
                const error = new Error("user not found")
                error.status = 405
                throw error
            }

            const token = createToken({ _id: user.id, email: user.email })
            const refreshTok = crypto.randomBytes(100).toString("hex")

            const saltRound = await bcrypt.genSalt(10)
            const hashedPassword = await bcrypt.hash(password, saltRound)

            user.password = hashedPassword
            await user.save()

            res.status(200).json({ message: "password updated" })

        } catch (error) {
            if (!error.status) {
                error.status = 500
            }
            if (error.field) {
                return res.status(error.status).json({ message: error.message, field: error.field })
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    verify_user: async (req, res, next) => {
        try {
            const { number } = req.body
            const id = req.get("id")
            if (!id) {
                const error = new Error("Request can't be completed, please request for new mail")
                error.field = "number"
                error.status = 403
                throw error
            }
            const user = await UserModel.findById(id)
            if (!user) {
                const error = new Error("Request can't be completed, please request for new mail")
                error.status = 403
                error.field = "number"
                throw error
            }
            if (!(user.verify_no === number)) {
                const error = new Error("Request can't be completed, invalid Code")
                error.status = 403
                error.field = "number"
                throw error
            }
            else {
                user.verified = true
            }
            res.status(200).json({ message: "Verified" })
            await user.save()
        } catch (error) {
            if (!error.status) {
                error.status = 500
            }
            if (error.field) {
                return res.status(error.status).json({ message: error.message, field: error.field })
            }
            res.status(error.status).json({ message: error.message })
        }

    },
    forgottenPasswordVerification: async (req, res, next) => {
        try {
            const param = req.get("Authorization");
            const token = param.split("|")[0];
            const id = param.split("|")[1];


            jwt.verify(token, process.env.JWT_SECRET, async (err, val) => {
                if (err) {
                    return next({ message: err.message, status: 300 });
                }

                const user = await UserModel.findOne({
                    _id: id,
                    email: val.email,
                });
                if (!user) {
                    return next({ status: 400, message: "Account not found" });
                }
                user.verified = true;
                const newToken = createToken({ _id: user._id, email: user.email })
                const tokenSave = await TokenModel.findOneAndUpdate(
                    { userId: id, _id: user.token },
                    { accesstoken: newToken }
                );
                await tokenSave.save();
                await user.save();
                res.status(200).json({ message: "updated" });
            });
        } catch (error) {
            if (!error.status) {
                error.status = 500
            }
            if (error.field) {
                return res.status(error.status).json({ message: error.message, field: error.field })
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    sendForgottenPasswordVerificatioMail: async (req, res, next) => {

        try {
            const { email } = req.body;

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const error = new Error(errors.errors[0].msg.message ? errors.errors[0].msg.message : errors.errors[0].msg)
                error.field = errors.errors[0].msg.field ? errors.errors[0].msg.field : errors.errors[0].param
                error.status = 403;
                throw error
            }
            let user = await UserModel.findOne({ email })

            const generatedToken = createToken({ email: user.email, _id: user._id })
            const refreshToken = crypto.randomBytes(100).toString("hex")
            const tokenSave = await TokenModel.findOneAndUpdate(
                { user: user._id },
                { accesstoken: generatedToken, refreshtoken: refreshToken }
            );
            await tokenSave.save();
            await user.save();
            //   await SendMail.sendMail(user.email, newToken, user._id);
            res.status(200).json({ message: "A mail has been sent to you " });
        } catch (error) {
            if (!error.status) {
                error.status = 500
            }
            if (error.field) {
                return res.status(error.status).json({ message: error.message, field: error.field })
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    forgottenPasswordHandler: async (req, res, next) => {
        try {
            const { password } = req.body
            const id = req.get("ID")
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                const errorVal = errors.errors
                const error = new Error(errors.errors[0].msg.message ? errors.errors[0].msg.message : errors.errors[0].msg)
                error.field = errors.errors[0].msg.field ? errors.errors[0].msg.field : errors.errors[0].param
                error.status = 403
                throw error
            }
            const user = await UserModel.findById(id)
            if (!user) {
                const error = new Error("user not found")
                error.status = 405
                throw error
            }
            const saltRound = await bcrypt.genSalt(10)
            const hashedPassword = await bcrypt.hash(password, saltRound)

            user.password = hashedPassword
            await user.save()

            res.status(200).json({ message: "password Updated successfully" })

        } catch (error) {
            if (!error.status) {
                error.status = 500
            }
            if (error.field) {
                return res.status(error.status).json({ message: error.message, field: error.field })
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    uploadCoverImage: async (req, res, next) => {
        uploadCoverImageMulter(req, res, async (err) => {
            try {
                if (err) {
                    if (err instanceof multer.MulterError) {
                        const error = new Error("Failed to upload file, please try again")
                        error.status = 405
                        throw error
                    } else {
                        const error = new Error(err.message)
                        error.status = 405
                        throw error
                    }
                }
                const user = await UserModel.findById({ _id: req.id })
                if (!user) {
                    const error = new Error("Request can't be completed")
                    error.status = 405
                    throw error
                }
                const prevPath = user.coverimage ? path.join(__dirname, "../", user.coverimage) : null

                const imgFile = req.file
                if (!imgFile) {
                    const error = new Error("No file uploaded")
                    error.status = 405
                    throw error
                }
                user.coverimage = imgFile.path;
                await user.save();
                if (prevPath) { deleteFile(prevPath) }
                res.status(200).json({ message: "cover picture uploaded" })
            } catch (error) {
                if (!error.status) {
                    error.status = 500
                }
                if (error.field) {
                    return res.status(error.status).json({ message: error.message, field: error.field })
                }
                res.status(error.status).json({ message: error.message })
            }
        })
    },
    uploadProfileImage: async (req, res, next) => {
        uploadProfileImageMulter(req, res, async (err) => {
            try {
                if (err) {
                    if (err instanceof multer.MulterError) {
                        const error = new Error("Failed to upload file, please try again")
                        error.status = 405
                        throw error
                    } else {
                        const error = new Error(err.message)
                        error.status = 405
                        throw error
                    }
                }
                const user = await UserModel.findById({ _id: req.id })
                if (!user) {
                    const error = new Error("Request can't be completed")
                    error.status = 405
                    throw error
                }
                const prevPath = user.profileimage ? path.join(__dirname, "../", user.profileimage) : null

                const imgFile = req.file
                if (!imgFile) {
                    const error = new Error("No file uploaded")
                    error.status = 405
                    throw error
                }
                user.profileimage = imgFile.path;
                await user.save();
                if (prevPath) { deleteFile(prevPath) }
                res.status(200).json({ message: "profile picture uploaded" })
            } catch (error) {
                if (!error.status) {
                    error.status = 500
                }
                if (error.field) {
                    return res.status(error.status).json({ message: error.message, field: error.field })
                }
                res.status(error.status).json({ message: error.message })
            }
        })
    },
    follow: async (req, res, next) => {
        try {
            const id = req.get("id")
            const user = await UserModel.findOne({ _id: req.id })
            const secondUser = await UserModel.findOne({ _id: id })
            if (!user || !secondUser) {
                const error = new Error("request can't be completed")
                error.status = 500
                throw error
            }
            if (id === user.id) {
                return res.status(200).json({ message: "" })
            }
            if (user.following.includes(secondUser._id)) {
                await UserModel.updateOne({ _id: req.id }, { $pull: { following: secondUser._id } })
                await UserModel.updateOne({ _id: id }, { $pull: { followers: user._id } })
                return res.status(200).json({ message: "You just unfollowed " + secondUser.firstname + " " + secondUser.lastname })
            }

            await UserModel.updateOne({ _id: req.id }, { $push: { following: secondUser._id } })
            await UserModel.updateOne({ _id: id }, { $push: { followers: user._id } })
            res.status(200).json({ message: "You just followed " + secondUser.firstname + " " + secondUser.lastname })

        } catch (error) {
            if (!error.status) {
                error.status = 500
            }
            if (error.field) {
                return res.status(error.status).json({ message: error.message, field: error.field })
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    followTopics: async (req, res, next) => {
        try {
            const user = await UserModel.findOne({ _id: req.id })
            const { name } = req.body
            if (!user) {
                const error = new Error("Request can't be completed")
                error.status = 500
                throw error
            }
            let isThere = await TopicModel.findOne({ name })

            if (isThere) {
                if (!isThere.people.includes(user._id)) {
                    await TopicModel.updateOne({ name }, { $push: { people: user._id }, number: isThere.number + 1 })
                } else {
                    await TopicModel.updateOne({ name }, { $pull: { people: user._id }, number: isThere.number - 1 })
                }
            } else {
                isThere = new TopicModel({
                    name: name,
                    location: user.country,
                    number: 1,
                    people: user._id
                })
            }

            await isThere.save()
            if (!user.followtopics.includes(isThere._id)) {
                await UserModel.updateOne({ _id: req.id }, { $push: { followtopics: isThere._id } })
                res.status(200).json({ message: 'following ' + name })
            } else {
                await UserModel.updateOne({ _id: req.id }, { $pull: { followtopics: isThere._id } })
                res.status(200).json({ message: 'unfollowed ' + name })
            }
        } catch (error) {
            if (!error.status) {
                error.status = 500
            }
            if (error.field) {
                return res.status(error.status).json({ message: error.message, field: error.field })
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    checkTrending: async (req, res, next) => {
        try {
            const user = await UserModel.findOne({ _id: req.id })
            const allTopics = await TopicModel.find({ location: user.country }).sort({ number: -1 }).limit(20)
            const newTrending = allTopics.map(el => ({ ...el._doc, trending: true }))

            const worldTrending = await TopicModel.find({ location: !user.country }).sort({ number: -1 }).limit(5)
            res.status(200).json({ message: "Trending News", trending: newTrending, world: worldTrending })
        } catch (error) {
            if (!error.status) {
                error.status = 500
            }
            if (error.field) {
                return res.status(error.status).json({ message: error.message, field: error.field })
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    updateUser: async (req, res, next) => {
        try {
            const { info, country, state, contact, address, showdetails, username } = req.body
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                const errorVal = errors.errors
                const error = new Error(errors.errors[0].msg.message ? errors.errors[0].msg.message : errors.errors[0].msg)
                error.field = errors.errors[0].msg.field ? errors.errors[0].msg.field : errors.errors[0].param
                error.status = 403
                throw error
            }
            const user = await UserModel.findOne({ _id: req.id })
            if (!user) {
                const error = new Error("Request can't be completed")
                error.status = 500
                throw error
            }
            await UserModel.updateOne(
                { _id: req.id },
                {
                    info: info ? info : "",
                    country: country ? country : "",
                    state: state ? state : "",
                    contact: contact ? contact : "",
                    address: address ? address : "",
                    showdetails: showdetails ? showdetails : true,
                    username: username ? username : user.username
                })

            res.status(200).json({ message: "Updated successfully" })
        } catch (error) {
            if (!error.status) {
                error.status = 500
            }
            if (error.field) {
                return res.status(error.status).json({ message: error.message, field: error.field })
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    fetchUserTags: async (req, res, next) => {
        try {
            const users = await UserModel.find().select("username").select("_id")
            res.status(200).json({ message: "All users avalable for tags", users })
        }
        catch (error) {
            if (!error.status) {
                error.status = 500
            }
            if (error.field) {
                return res.status(error.status).json({ messageg: error.message, field: error.field })
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    fetchTopicTags: async (req, res, next) => {
        try {
            const topics = await TopicModel.find().select("name").select("_id")
            res.status(200).json({ message: "All users avalable for tags", topics })
        }
        catch (error) {
            if (!error.status) {
                error.status = 500
            }
            if (error.field) {
                return res.status(error.status).json({ messageg: error.message, field: error.field })
            }
            res.status(error.status).json({ message: error.message })
        }
    }
}


module.exports = UserController