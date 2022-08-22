const multer = require("multer")
const fs = require("fs");
const MediaModel = require("../models/media-model");
const PostModel = require("../models/posts");
const TopicModel = require("../models/topic-model");
const UserModel = require("../models/user-model");
const { validationResult } = require("express-validator");
const CommentModel = require("../models/comment-model");
const CommentReplyModel = require("../models/comment-reply");


const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = "images/posts";
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        cb(null, dir);
    },
    filename: async (req, file, cb) => {
        if (file.mimetype.includes("image")) {
            cb(null, Date.now() + "-image.jpeg");
        } else {
            cb(null, Date.now() + "-video.mp4");
        }

    },
});

const fileFilter = (req, file, cb) => {
    if (!(file.mimetype.includes("image") || file.mimetype.includes("video"))) {
        const error = new Error("failed to upload");
        error.status = 405;
        cb(null, false);
    } else {
        cb(null, true);
    }
};

const uploadForPost = multer({ storage: fileStorage, fileFilter: fileFilter, }).any("media");


const Controller = {
    createPost: async (req, res, next) => {
        uploadForPost(req, res, async (err) => {
            try {
                const val = req.files
                const { caption, tags, topics } = req.body
                const user = await UserModel.findOne({ _id: req.id })
                const pathVal = []
                for (key of req.files) {
                    if (key.mimetype.includes("video")) {
                        const vid = new MediaModel({
                            path: key.path,
                            author: req.id
                        })
                        await vid.save()
                    }

                    pathVal.push({ type: key.mimetype.includes("image") ? "image" : "video", path: key.path })
                }
                if (topics.length > 0) {
                    for (let topic of topics) {
                        const isThere = await TopicModel.countDocuments({ name: topic })
                        if (!(isThere > 0)) {
                            const val = new TopicModel({
                                name: topic,
                                number: 1,
                                location: user.location
                            })
                            await val.save()
                        }
                    }
                }
                let userIds = []
                if (tags && tags.length > 0) {
                    for (let people of tags) {
                        const userId = await UserModel.findOne({ username: people }).select("_id")
                        if (userId) {
                            userIds.push(userId._id)
                        }

                    }
                }
                const topicIds = await TopicModel.find({ name: { $in: topics } }).select("_id")
                const post = new PostModel(
                    {
                        author: req.id,
                        caption: caption ? caption : null,
                        tags: tags ? userIds : [],
                        medialink: pathVal.length > 0 ? pathVal : [],
                        topics: topicIds
                    }
                )
                TopicModel.updateMany
                await TopicModel.updateMany({ _id: { $in: topicIds } }, {
                    $push: { posts: post._id }
                })
                await UserModel.updateMany({ _id: req.user }, {
                    $push: { posts: post._id }
                })

                await post.save()
                res.status(200).json({ message: 'Ademola' })

            } catch (error) {
                if (!error.status) {
                    error.status = 500
                }
                res.status(error.status).json({ message: error.message })
            }
        })
    },
    editPost: async (req, res, next) => {
        try {
            const id = req.params.id
            if (!id) {
                const error = new Error("Request can't be completed")
                error.status = 400
                throw error
            }
            const { disable_comment, caption } = req.body
            const Post = await PostModel.findById(id)
            if (!Post) {
                const error = new Error("Request can't be completed,Please try again")
                error.status = 400
                throw error
            }
            await PostModel.updateOne({ _id: Post._id }, {
                disable_comment: disable_comment ? disable_comment : Post.disable_comment,
                caption: caption ? caption : Post.caption
            })
            res.status(200).json({ message: "successful" })
        } catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    deletePost: async (req, res, next) => {
        try {
            const id = req.params.id
            if (!id) {
                const error = new Error("Request can't be completed")
                error.status = 400
                throw error
            }
            const Post = await PostModel.findById(id)
            if (!Post) {
                const error = new Error("Request can't be completed,Please try again")
                error.status = 400
                throw error
            }
            await PostModel.DeleteOne({ _id: Post._id, author: req.id })
            res.status(200).json({ message: "Your Post has been deleted" })
        } catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    readAllPost: async (req, res, next) => {
        try {
            const { skip, limit, page } = req.query
        }
        catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(500).jsnon({ message: error.message })
        }
    },
    readSinglePost: async (req, res, next) => {
        try {
            const id = req.params.id
            if (!id) {
                const error = new Error("Request can't be completed")
                error.status = 400
                throw error
            }
            const Post = await PostModel.findById(id).select("medialink")
            if (!Post) {
                const error = new Error("Request can't be completed,Please try again")
                error.status = 400
                throw error
            }
            res.status(200).json({ message: "Post media", post: Post })
        } catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    readPostComment: async (req, res, next) => {
        try {
            const id = req.params.id
            if (!id) {
                const error = new Error("Request can't be completed")
                error.status = 400
                throw error
            }
            const Post = await PostModel.findById(id).select("comments").populate("comments")
            if (!Post) {
                const error = new Error("Request can't be completed,Please try again")
                error.status = 400
                throw error
            }
            res.status(200).json({ message: "comments", post: Post.disable_comment ? null : Post })
        } catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    reactToPostPost: async (req, res, next) => {
        try {
            const { reaction } = req.body
            const id = req.params.id
            if (!reaction || !id) {
                const error = new Error("request can't be completed")
                error.status = 400
                throw error
            }
            const post = await PostModel.findOne({ _id: id })
            if (!post) {
                const error = new Error("request can't be completed")
                error.status = 400
                throw error
            }
            PostModel.updateOne({ _id: id }, {
                $push: {
                    reactions: { type_reaction: reaction, by: req.id }
                }
            })
            res.status(200).json({ message: "Reacted to post" })
        }
        catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    commentPost: async (req, res, next) => {
        try {
            const id = req.params.id
            if (!id) {
                const error = new Error("request can't be completed")
                error.status = 400
                throw error
            }
            const user = await UserModel.findOne({ _id: id })
            const post = await PostModel.findOne({ _id: id })
            if (!post) {
                const error = new Error("request can't be completed")
                error.status = 400
                throw error
            }

            const { message } = req.body
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                const errorVal = errors.errors
                const error = new Error(errors.errors[0].msg.message ? errors.errors[0].msg.message : errors.errors[0].msg)
                error.field = errors.errors[0].msg.field ? errors.errors[0].msg.field : errors.errors[0].param
                error.status = 403
                throw error
            }
            const commentVal = new CommentModel({ author: req.id, comment: message, postId: post._id })
            await commentVal.save()
            res.status(200).json({ message: "successful" })
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
    reactToComment: async (req, res, next) => {
        try {
            const user = await UserModel.findOne({ _id: req.id });
            if (!user) {
                const error = new Error("request can't be completed")
                error.status = 400
                throw error
            }
            const commentId = req.params.id
            const { reaction, post_id } = req.body
            const comment = await CommentModel.findOne({ _id: commentId, postId: post_id })
            if (!comment) {
                const error = new Error("request can't be completed")
                error.status = 400
                throw error
            }
            await CommentModel.updateOne({ _id: commentId, postId: post_id }, {
                $push: { reactions: { type_reaction: reaction, by: req.id } }
            })
            res.status(200).json({ message: "successful" })

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
    commentToComment: async (req, res, next) => {
        try {
            const comment_id = req.params.id
            const { postId, message } = req.body
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                const errorVal = errors.errors
                const error = new Error(errors.errors[0].msg.message ? errors.errors[0].msg.message : errors.errors[0].msg)
                error.field = errors.errors[0].msg.field ? errors.errors[0].msg.field : errors.errors[0].param
                error.status = 403
                throw error
            }
            const commentVal = new CommentReplyModel({ author: req.id, message: message, post_id: post._id })
            await commentVal.save()
            res.status(200).json({ message: "successful" })
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
    reactToCommentofComment: async (req, res, next) => {
        try {
            const user = await UserModel.findOne({ _id: req.id });
            if (!user) {
                const error = new Error("request can't be completed")
                error.status = 400
                throw error
            }
            const commentId = req.params.id
            const { reaction, post_id, comment_id, replyCommentId } = req.body
            const comment = await CommentReplyModel.findOne({ _id: commentId, post_id: post_id, comment_id: comment_id, reply_comment_id: replyCommentId ? replyCommentId : "" })
            if (!comment) {
                const error = new Error("request can't be completed")
                error.status = 400
                throw error
            }
            await CommentModel.updateOne({ _id: commentId, postId: post_id }, {
                $push: { reactions: { type_reaction: reaction, by: req.id } }
            })
            res.status(200).json({ message: "successful" })

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
    commentToOfComment: async (req, res, next) => {
        try {
            const user = await UserModel.findOne({ _id: req.id });
            if (!user) {
                const error = new Error("request can't be completed")
                error.status = 400
                throw error
            }
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                const errorVal = errors.errors
                const error = new Error(errors.errors[0].msg.message ? errors.errors[0].msg.message : errors.errors[0].msg)
                error.field = errors.errors[0].msg.field ? errors.errors[0].msg.field : errors.errors[0].param
                error.status = 403
                throw error
            }
            const commentId = req.params.id
            const { reaction, post_id, comment_id, replyCommentId } = req.body
            const comment = new CommentReplyModel({
                _id: commentId,
                post_id: post_id,
                comment_id: comment_id,
                reply_comment_id: replyCommentId ? replyCommentId : ""
            })
            await commentVal.save()
            res.status(200).json({ message: "successful" })
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
    getCommentOfComment: async (req, res, next) => {
        try {
            const id = req.params.id
            const commentId = id.split("|")[1]
            const Postid = id.split("|")[0]
            if (!id) {
                const error = new Error("Request can't be completed")
                error.status = 400
                throw error
            }
            const Comments = await CommentReplyModel.find({ posts_id: Postid, comment_id: commentId })
            if (!Post) {
                const error = new Error("Request can't be completed,Please try again")
                error.status = 400
                throw error
            }
            res.status(200).json({ message: "comments", comment: Comments })
        } catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    }

}
module.exports = Controller