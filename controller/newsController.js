const News = require("../model/newsModel");
const APIFeatures = require("../utils/apiFeatures");
const { success } = require("../utils/resStatus");
const Images = require("../model/imagesModel");
const fs = require("fs");
const path = require("path");
const getAllNews = async (req, res) => {
  const { search } = req.query;
  try {
    if (search) {
      const features = new APIFeatures(
        News.fuzzySearch(search).populate("category createdBy"),
        req.query
      )
        .paginate()
        .fields()
        .sort()
        .filter();
      const featuresCount = new APIFeatures(
        News.fuzzySearch(search).populate("category createdBy"),
        req.query
      ).filter();
      const [data, totalCount] = await Promise.all([
        features.query,
        featuresCount.query.countDocuments(),
      ]);

      return res
        .status(200)
        .json({ message: success, results: data.length, totalCount, data });
    }

    const queryObj = { ...req.query };
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((el) => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    const parsedQuery = JSON.parse(queryStr);

    const features = new APIFeatures(
      News.find(parsedQuery).populate("category createdBy images"),
      req.query
    )
      .paginate()
      .fields()
      .sort()
      .filter();

    const [data, totalCount] = await Promise.all([
      features.query,
      News.countDocuments(parsedQuery),
    ]);

    res
      .status(200)
      .json({ message: success, results: data.length, totalCount, data });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

const getSingleNews = async (req, res) => {
  try {
    const { id } = req.params;
    const news = await News.findById(id).populate("createdBy category images");
    if (!news) return res.status(404).json({ message: "not found" });
    res.json({ data: news });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

const createNews = async (req, res) => {
  try {
    const { body } = req;
    const { files } = req;
    const images = files.images;

    if (!images || images?.length === 0)
      return res
        .status(400)
        .json({ message: "you have to add one image atlest" });

    const video = files.video ? files.video[0].filename : "";
    const currentUserId = req.currentUser.id;
    if (!body.publishedAt) {
      body.publishedAt = Date.now();
    }
    const newNews = await News.create({
      ...body,
      createdBy: currentUserId,
      video,
    });
    const newImages = await Promise.all(
      images.map((file) =>
        Images.create({
          newsId: newNews._id,
          src: file.filename,
        })
      )
    );

    res.status(201).json({
      message: "created new news successfully",
      data: newNews,
      images: newImages,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

const deleteNews = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ message: "ids must be a non-empty array" });
    const newsList = await News.find({ _id: { $in: ids } });
    newsList.forEach((news) => {
      if (news.video) {
        const videoPath = path.join(__dirname, "../public/videos", news.video);
        fs.unlink(videoPath, (err) => {
          if (err)
            console.error(`Error deleting video: ${videoPath}`, err.message);
        });
      }
    });
    const images = await Images.find({ newsId: { $in: ids } });
    images.forEach((img) => {
      const imagePath = path.join(__dirname, "../public/images", img.src);
      fs.unlink(imagePath, (err) => {
        if (err)
          console.error(`Error deleting image: ${imagePath}`, err.message);
      });
    });
    await Images.deleteMany({ newsId: { $in: ids } });
    const results = await News.deleteMany({ _id: { $in: ids } });
    res.json({
      message: `${results.deletedCount} news deleted successfully (with images & videos)`,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
};

const updateNews = async (req, res) => {
  try {
    const { id } = req.params;
    const oldData = await News.findById(id).populate("images");
    if (!oldData) return res.status(404).json({ message: "News not found" });
    const images = req.files?.images || [];
    const video = req.files?.video || [];
    const totalImages = images.length + oldData.images.length;
    if (totalImages > 4) {
      res.status(400).json({
        message: `You can only add 4 images. You tried to add ${totalImages}.`,
      });
      return images.forEach((file) => {
        const imagePath = path.join(
          __dirname,
          "../public/images",
          file.filename
        );
        fs.unlinkSync(imagePath, (err) => err && console.log(err));
      });
    }
    const updatedNews = await News.findByIdAndUpdate(
      id,
      {
        ...req.body,
        video: video[0]?.filename || oldData.video,
      },
      { new: true }
    );
    if (video[0]?.filename && oldData.video) {
      const videoPath = path.join(__dirname, "../public/videos", oldData.video);
      fs.unlink(videoPath, (err) => err && console.log(err));
    }
    const newImages = await Promise.all(
      images.map((file) => Images.create({ newsId: id, src: file.filename }))
    );
    res.json({
      message: "Updated successfully",
      data: updatedNews,
      newImages,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllNews,
  createNews,
  deleteNews,
  getSingleNews,
  updateNews,
};
