const APIFeatuers = require("../utils/apiFeatures");
const Comments = require("../model/commentModel");
const News = require("../model/newsModel");

const getComments = async (req, res) => {
  try {
    const { id: newsId } = req.params;
    if (!newsId) return res.status(400).json({ message: "newsId not found" });
    const featuer = new APIFeatuers(
      Comments.find({ newsId }).lean().populate("user"),
      req.query
    )
      .paginate()
      .sort();
    const [comments, commentsCount] = await Promise.all([
      featuer.query,
      Comments.countDocuments({ newsId }),
    ]);
    res.json({
      message: "success",
      result: comments.length,
      totalCount: commentsCount,
      data: comments,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};
const addComment = async (req, res) => {
  try {
    const { comment } = req.body;
    const { id: newsId } = req.params;
    const existingNews = await News.findById(newsId);
    if (!existingNews)
      return res.status(404).json({ message: "news nout found" });
    const currentUser = req.currentUser.id;
    const newComment = new Comments({ comment, user: currentUser, newsId });
    await newComment.save();
    res.status(201).json({ message: "created successfully", data: newComment });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};
const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedComment = await Comments.findByIdAndDelete(id);

    if (!deletedComment)
      return res.status(404).json({ message: `no comment with id ${id}` });
    res.json({ message: "delete one comment successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};
const updateComment = async (req, res) => {
  try {
    const { comment } = req.body;
    const { id } = req.params;
    const updatedComment = await Comments.findByIdAndUpdate(
      id,
      { comment },
      {
        new: true,
      }
    );
    if (!updatedComment)
      return res.status(404).json({ message: "comment not found" });
    res.json({ message: "updated successfully", data: updatedComment });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};
module.exports = { getComments, addComment, deleteComment, updateComment };
