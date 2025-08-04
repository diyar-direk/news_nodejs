const express = require("express");
const router = express.Router();

const handleMulterError = (req, res, next) => {
  uploadUserProfile.single("profile")(req, res, function (err) {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

const {
  getAllUsers,
  register,
  getUser,
  deleteUsers,
  login,
  updateUser,
} = require("../controller/usersController");
const allowdTo = require("../middleware/allowdTo");
const { uploadUserProfile } = require("../controller/mediaController");
router
  .route("/")
  .get(allowdTo(["admin"]), getAllUsers)
  .post(allowdTo(["admin"]), handleMulterError, register)
  .delete(allowdTo(["admin"]), deleteUsers);
router
  .route("/:id")
  .get(allowdTo(["admin"]), getUser)
  .patch(allowdTo(["admin"]), handleMulterError, updateUser);

router.route("/login").post(login);

module.exports = router;
