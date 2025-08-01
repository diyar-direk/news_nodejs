const express = require("express");
const {
  getAllNews,
  createNews,
  deleteNews,
  getSingleNews,
  updateNews,
} = require("../controller/newsController");
const allowdTo = require("../middleware/allowdTo");
const filesMiddleWare = require("../middleware/filesMiddleWare");
const { deleteImage, deleteVideo } = require("../controller/mediaController");
const router = express.Router();
router
  .route("/")
  .get(getAllNews)
  .post(allowdTo(["admin", "user"]), filesMiddleWare, createNews)
  .delete(allowdTo(["admin"]), deleteNews);
router
  .route("/:id")
  .get(getSingleNews)
  .patch(allowdTo(["admin"]), filesMiddleWare, updateNews);
router.route("/delete-image/:id").delete(allowdTo(["admin"]), deleteImage);
router.route("/delete-video/:src").delete(allowdTo(["admin"]), deleteVideo);
module.exports = router;
