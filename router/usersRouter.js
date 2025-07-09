const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  register,
  getUser,
  deleteUsers,
  login,
  updateUser,
} = require("../controller/usersController");
router.route("/").get(getAllUsers).post(register);
router.route("/:id").get(getUser).patch(updateUser);
router.route("/delete-many").delete(deleteUsers);
router.route("/login").post(login);

module.exports = router;
