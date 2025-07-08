const mongoose = require("mongoose");
const validator = require("validator");

const userSechema = new mongoose.Schema({
  username: {
    unique: true,
    type: String,
    minlength: 4,
    required: true,
    validate: {
      validator: function (v) {
        return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(v);
      },
      message:
        "Username must start with a letter and contain only letters, numbers, or underscores.",
    },
  },
  email: {
    type: String,
    unique: true,
    validate: [validator.isEmail, "must be a valide email"],
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
    enum: ["admin", "user"],
    default: "user",
  },
});
module.exports = mongoose.model("Users", userSechema);
