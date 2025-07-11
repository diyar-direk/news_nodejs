const User = require("../model/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { success, faild } = require("../utils/resStatus");
const getAllUsers = async (req, res) => {
  try {
    const { query } = req;
    const limit = query.limit || 10;
    const page = query.page || 1;
    const skip = (page - 1) * limit;
    const allUsers = await User.find({}, { __v: false })
      .limit(limit)
      .skip(skip)
      .populate("createdBy");
    return res.json({ data: allUsers, dataLength: allUsers.length, success });
  } catch (error) {
    console.log(error);
    return res.json({ message: error.message, success: faild }).status(500);
  }
};
const getUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).populate("createdBy");
    if (!user)
      return res.status(404).json({ data: null, message: "user not found" });
    return res.json({ data: user, success: success });
  } catch (error) {
    console.log(error);
    return res.json({ message: error.message }).status(500);
  }
};

const deleteUsers = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ message: "ids must be not empty array" });
    const results = await User.deleteMany({ _id: { $in: ids } });
    return res.json({
      message: `${results.deletedCount} users deleted successfully`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const register = async (req, res) => {
  try {
    const bodyRequest = req.body;
    const isUserExist = await User.findOne({
      $or: [{ email: bodyRequest.email }, { username: bodyRequest.username }],
    });
    if (isUserExist) {
      const isemailtaken = bodyRequest.email === isUserExist.email;
      return res.status(500).json({
        message: `this ${isemailtaken ? "email" : "username"} already exist`,
        success: faild,
      });
    }
    const { password } = bodyRequest;
    if (password.length < 5)
      return res
        .status(500)
        .json({ data: null, success: faild, message: "password is to short" });
    const newPassword = await bcrypt.hash(password, 8);
    const currentUser = req.currentUser;

    const data = new User({
      ...bodyRequest,
      password: newPassword,
      createdBy: currentUser.id,
    });
    await data.save();

    return res
      .status(201)
      .json({ data, success: success, message: "created succesfuly" });
  } catch (error) {
    console.log(error);

    return res
      .status(500)
      .json({ data: null, success: faild, message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const findUser = await User.findOne({
      $or: [{ username }, { email: username }],
    }).select("+password");

    if (!findUser)
      return res.status(404).json({ data: null, message: "no user found" });
    const checkPassword = await bcrypt.compare(password, findUser.password);
    if (!checkPassword)
      return res
        .status(400)
        .json({ data: null, message: "wrong username or password" });
    const token = jwt.sign(
      {
        id: findUser._id,
        role: findUser.role,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" }
    );
    return res.json({ success: success, user: findUser, token });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ data: null, success: faild, message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, role } = req.body;
    if (role && (role !== "admin" || role !== "user"))
      return res
        .status(400)
        .json({ data: null, message: "user role must be admin or user only" });
    const user = await User.findByIdAndUpdate(
      id,
      {
        firstName,
        lastName,
        role,
      },
      { new: true, select: "-password -__v" }
    );
    if (!user)
      return res.status(404).json({ data: null, message: "user not found" });
    return res.json({
      success,
      data: user,
      message: "updated succesfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllUsers,
  register,
  getUser,
  deleteUsers,
  login,
  updateUser,
};
