const express = require("express");
const allowdTo = require("../middleware/allowdTo");
const {
  getCategories,
  createCategory,
  updateCategory,
  getSingleCategory,
  deleteCategories,
} = require("../controller/categoriesController");
const router = express.Router();
router
  .route("/")
  .get(getCategories)
  .post(allowdTo(["admin", "user"]), createCategory)
  .delete(allowdTo(["admin", "user"]), deleteCategories);
router.route("/:id").get(allowdTo(["admin", "user"]), getSingleCategory);
router.route("/:id").patch(allowdTo(["admin", "user"]), updateCategory);

module.exports = router;
