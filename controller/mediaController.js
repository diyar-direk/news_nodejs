const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Images = require("../model/imagesModel");
const News = require("../model/newsModel");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath;
    if (file.fieldname === "images") {
      uploadPath = path.join(__dirname, "../public/images");
    } else if (file.fieldname === "video") {
      uploadPath = path.join(__dirname, "../public/videos");
    } else {
      return cb(new Error("نوع الحقل غير معروف"), false);
    }

    fs.mkdirSync(uploadPath, { recursive: true });

    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const filename = `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;
    cb(null, filename);
  },
});

const fileFilter = (req, file, cb) => {
  const fileExt = path.extname(file.originalname).toLowerCase();
  if (file.fieldname === "images") {
    cb(null, [".png", ".jpg", ".jpeg"].includes(fileExt));
  } else if (file.fieldname === "video") {
    cb(null, [".mp4", ".mkv"].includes(fileExt));
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 },
});

const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;
    const image = await Images.findByIdAndDelete(id);
    if (!image) return res.status(404).json({ message: "image not found" });
    const imagePath = path.join(__dirname, "../public/images", image.src);
    fs.unlink(imagePath, (err) => console.log(err?.message));
    res.json({ message: "image delete successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const deleteVideo = async (req, res) => {
  const { src } = req.params;
  try {
    const deletedVideo = await News.findOneAndUpdate(
      { video: src },
      { video: "" }
    );
    if (!deletedVideo)
      return res.status(404).json({ message: `video not found` });
    const videoPath = path.join(__dirname, "../public/videos", src);
    fs.unlink(videoPath, (err) => console.log(err?.message));
    res.json({ message: "video deleted successfully" });
  } catch (error) {
    res.json({ message: error.message }).status(500);
  }
};
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const imagePath = path.join(__dirname, "../public/images");
    fs.mkdirSync(imagePath, { recursive: true });
    cb(null, imagePath);
  },
  filename: (req, file, cb) => {
    const filename = `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;
    cb(null, filename);
  },
});
const uploadUserProfile = multer({
  storage: profileStorage,
  fileFilter: (req, file, cb) => {
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = [".png", ".jpg", ".jpeg"];
    if (!allowedExtensions.includes(fileExtension)) {
      return cb(
        new Error("Only .png, .jpg, and .jpeg formats are allowed!"),
        false
      );
    }
    cb(null, true);
  },
});

module.exports = { upload, deleteImage, deleteVideo, uploadUserProfile };
