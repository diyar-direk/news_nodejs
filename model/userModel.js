const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      minlength: 4,
      trim: true,
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
      required: true,
      validate: [validator.isEmail, "Must be a valid email"],
    },
    password: {
      type: String,
      required: true,
      select: false,
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
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    profile: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true });

userSchema.index({ firstName: 1, lastName: 1 });

module.exports = mongoose.model("User", userSchema);
