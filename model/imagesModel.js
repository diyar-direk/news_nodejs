const mongoose = require("mongoose");
const imagesSchema = mongoose.Schema({
  newsId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "News",
    required: true,
  },
  src: {
    type: String,
    required: true,
  },
});
module.exports = mongoose.model("Image", imagesSchema);
