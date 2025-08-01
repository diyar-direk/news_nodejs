const Category = require("../model/categoriesModel");
const APIFeatures = require("../utils/apiFeatures");
const { success } = require("../utils/resStatus");
const search = require("../utils/search");
const getCategories = async (req, res) => {
  if (req.query.search)
    return await search(Category, ["name"], "createdBy", req, res);

  try {
    const queryObj = req.query;
    const excludedFields = ["page", "sort", "limit", "fields", "search"];
    excludedFields.forEach((el) => delete queryObj[el]);
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    const parsedQuery = JSON.parse(queryStr);
    const features = new APIFeatures(
      Category.find().lean().populate("createdBy"),
      req.query
    )
      .paginate()
      .sort()
      .fields()
      .filter();
    const [data, totalCount] = await Promise.all([
      features.query,
      Category.countDocuments(parsedQuery),
    ]);
    res.status(200).json({ success, results: data.length, totalCount, data });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
const getSingleCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id).populate("createdBy");
    if (!category)
      return res.status(404).json({ message: "category not found" });
    res.status(200).json({ message: success, data: category });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const currentUser = req.currentUser;

    const data = new Category({ name, createdBy: currentUser.id });
    await data.save();

    res.status(201).json({ message: "Category created successfully", data });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Category name already exists",
        data: null,
        code: error.code,
      });
    }

    res.status(500).json({ message: "Internal server error", data: null });
  }
};
const updateCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const { id } = req.params;
    const category = await Category.findByIdAndUpdate(
      id,
      { name },
      { new: true, select: "-__v" }
    );
    if (!category)
      return res.status(404).json({ message: "category not found" });
    res
      .status(200)
      .json({ success, data: category, message: "updated succesfully" });
  } catch (error) {
    res.json(500).json({ message: error.message });
  }
};
const deleteCategories = async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0)
    return res
      .status(400)
      .json({ message: "ids must be not empty array of ids" });
  try {
    const deleteCount = await Category.deleteMany({ _id: { $in: ids } });
    res.status(200).json({
      message: `${deleteCount.deletedCount} categories deleted successfully`,
    });
  } catch (error) {
    return res.status(error.code).json({ message: error.message });
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  getSingleCategory,
  deleteCategories,
};
