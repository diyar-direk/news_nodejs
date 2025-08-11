const User = require("../model/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { success, faild } = require("../utils/resStatus");
const APIFeatures = require("../utils/apiFeatures");
const search = require("../utils/search");
const fs = require("fs");
const path = require("path");
const getAllUsers = async (req, res) => {
  if (req.query.search) {
    return await search(
      User,
      ["username", "firstName", "lastName"],
      "createdBy",
      req,
      res
    );
  }
  try {
    const queryObj = req.query;
    const excludedFields = ["page", "sort", "limit", "fields", "search"];
    excludedFields.forEach((el) => delete queryObj[el]);
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    const parsedQuery = JSON.parse(queryStr);
    const features = new APIFeatures(
      User.find().lean().populate("createdBy"),
      req.query
    )
      .paginate()
      .sort()
      .fields()
      .filter();
    const [users, totalCount] = await Promise.all([
      features.query,
      User.countDocuments(parsedQuery),
    ]);
    res.status(200).json({
      status: "success",
      results: users.length,
      totalCount,
      data: users,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
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
    const users = await User.find({
      _id: { $in: ids },
      profile: { $nin: [null, ""] },
    });
    users.forEach((user) => {
      if (user.profile) {
        const imagePath = path.join(
          __dirname,
          "../public/images",
          user.profile
        );
        fs.unlinkSync(imagePath);
      }
    });
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
  const profile = req.file?.filename || "";
  try {
    const bodyRequest = req.body;
    const isUserExist = await User.findOne({
      $or: [{ email: bodyRequest.email }, { username: bodyRequest.username }],
    });
    if (isUserExist) {
      const isEmailTaken = bodyRequest.email === isUserExist.email;
      removeProfileOnCreateError(profile);
      return res.status(400).json({
        message: `This ${isEmailTaken ? "email" : "username"} already exists`,
        success: false,
      });
    }
    const { password } = bodyRequest;

    if (!password || password.length < 5) {
      removeProfileOnCreateError(profile);
      return res.status(400).json({
        data: null,
        success: false,
        message: "Password must be more than 4 characters",
      });
    }

    const newPassword = await bcrypt.hash(password, 8);
    const currentUser = req.currentUser;

    const userData = new User({
      ...bodyRequest,
      password: newPassword,
      createdBy: currentUser.id,
      profile,
    });

    await userData.save();

    const userObject = userData.toObject();
    delete userObject.password;
    return res.status(201).json({
      data: userObject,
      success: true,
      message: "Created successfully",
    });
  } catch (error) {
    console.log(error);
    removeProfileOnCreateError(profile);
    return res.status(500).json({
      data: null,
      success: false,
      message: error.message,
    });
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
    const user = findUser.toObject();
    delete user.password;
    delete user.__v;
    return res.json({
      success: true,
      user,
      token,
      message: `welcome back ${user.firstName} ${user.lastName}`,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ data: null, success: false, message: error.message });
  }
};

const updateUser = async (req, res) => {
  const newProfile = req.file?.filename || "";
  try {
    const { id } = req.params;
    const { firstName, lastName, role } = req.body;

    if (role && role !== "admin" && role !== "user") {
      removeProfileOnCreateError(newProfile);
      return res
        .status(400)
        .json({ data: null, message: "user role must be admin or user only" });
    }

    const existingUser = await User.findById(id);
    if (!existingUser) {
      removeProfileOnCreateError(newProfile);
      return res.status(404).json({ data: null, message: "user not found" });
    }

    if (newProfile && existingUser.profile) {
      removeProfileOnCreateError(existingUser.profile);
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        firstName,
        lastName,
        role,
        profile: newProfile || existingUser.profile,
      },
      { new: true, select: "-password -__v" }
    );

    return res.json({
      success: true,
      data: updatedUser,
      message: "updated successfully",
    });
  } catch (error) {
    console.error(error);
    if (newProfile) removeProfileOnCreateError(newProfile);
    res.status(500).json({ message: error.message });
  }
};

const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.currentUser.id).select(
      "-password -__v"
    );
    if (!user)
      return res.status(404).json({ data: null, message: "user not found" });
    return res.json({
      success: true,
      data: user,
      message: "user details fetched successfully",
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ data: null, success: false, message: error.message });
  }
};

module.exports = {
  getAllUsers,
  register,
  getUser,
  deleteUsers,
  login,
  updateUser,
  getUserDetails,
};

const removeProfileOnCreateError = (profile) => {
  if (profile) {
    const imagePath = path.join(__dirname, "../public/images", profile);
    return fs.unlinkSync(imagePath);
  }
};
