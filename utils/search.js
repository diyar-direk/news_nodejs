const APIFeatures = require("./apiFeatures");
const search = async (model, fields, populate = "", req, res) => {
  try {
    const query = req.query.search;
    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }
    const tokens = query.split(" ").map((word) => new RegExp(word, "i"));
    const searchConditions = tokens.map((token) => ({
      $or: fields.map((field) => ({ [field]: token })),
    }));
    let populateObject = populate;
    try {
      populateObject = eval(`(${populate})`);
    } catch (error) {}
    const features = new APIFeatures(
      model
        .find({ $and: searchConditions })
        .populate(populateObject || "")
        .lean(),
      req.query
    )
      .sort()
      .fields()
      .paginate()
      .filter();
    const totalResults = new APIFeatures(
      model.countDocuments({
        $and: searchConditions,
      }),
      req.query
    ).filter();
    const [results, totalCount] = await Promise.all([
      features.query,
      totalResults.query.countDocuments(),
    ]);
    return res.status(200).json({
      status: "success",
      totalCount,
      results: results.length,
      data: results,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: err.message || "Something went wrong during the search",
    });
  }
};
module.exports = search;
