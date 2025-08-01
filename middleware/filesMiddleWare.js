const multer = require("multer");
const { upload } = require("../controller/mediaController");
module.exports = (req, res, next) => {
  upload.fields([
    { name: "images", maxCount: 4 },
    { name: "video", maxCount: 1 },
  ])(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res
        .status(400)
        .json({ message: `خطأ في رفع الملفات: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: `خطأ: ${err.message}` });
    }
    next();
  });
};
