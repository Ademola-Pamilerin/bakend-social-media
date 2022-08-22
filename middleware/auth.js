const jwt = require("jsonwebtoken");
const UserModel = require("../models/user-model");
const TokenModel = require("../models/token-model")
const { createToken } = require("../utils/token")


const Authorize = async (req, res, next) => {
  try {
    const refreshToken = req.get("RefreshToken");
    const rawtoken = req.get("Authorization")
    if (!rawtoken) {
      return next({ message: "Please login to continue", status: 400 });
    }
    const token = rawtoken.replace("Bearer ", "");

    if (!token) {
      return next({ message: "Please login to continue", status: 400 });
    }
    jwt.verify(token, process.env.JWT_SECRET, async (error, decoded) => {
      if (error) {
        if (error.message === "jwt expired") {
          if (!refreshToken) {
            return next({ message: "Please login to continue", status: 400 });
          }
          const tokenDat = await TokenModel.findOne({
            refreshToken: refreshToken
          });
          console.log(tokenDat.user)
          if (!tokenDat) {
            return next({ message: "Please login to continue", status: 400 });
          }
          const user = await UserModel.findOne({ token: tokenDat._id })
          if (!user) {
            return next({ message: "Please login to continue", status: 400 });
          }

          const newToken = createToken({
            _id: user._id,
            email: user.email,
          })
          tokenDat.accesstoken = newToken
          await tokenDat.save()
          await user.save();
          req.id = user._id
          req.user = user;
          return next();
        }
        return next({ message: "Please login to continue", status: 400 });
      }
      const { _id: id, email } = decoded;
      const user = await UserModel.findOne({ _id:id, email });
      if (!user) next({ message: "Please login to continue", status: 400 });
      req.id = user._id;
      req.user = user;
      next();
    });
  } catch (error) {
    if (!error.status) {
      error.status = 500;
    }
    res.status(error.status).json({ message: error.message });
  }
};
module.exports = Authorize;
