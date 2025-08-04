const express = require("express");
const {
  getComments,
  addComment,
  deleteComment,
  updateComment,
} = require("../controller/commentController");
const allowdTo = require("../middleware/allowdTo");
const router = express.Router();

router
  .route("/:id")
  .get(getComments)
  .post(allowdTo(["admin", "user"]), addComment)
  .delete(allowdTo(["admin", "user"]), deleteComment)
  .patch(allowdTo(["admin", "user"]), updateComment);
module.exports = router;
