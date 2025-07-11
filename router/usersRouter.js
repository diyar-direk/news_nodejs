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
const allowdTo = require("../middleware/allowdTo");
router
  .route("/")
  .get(allowdTo(["admin"]), getAllUsers)
  .post(allowdTo(["admin"]), register);
router.route("/:id").get(allowdTo(["admin"]), getUser);
router.route("/delete-many").delete(allowdTo(["admin"]), deleteUsers);
router.route("/login").post(login);

module.exports = router;
