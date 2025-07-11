const mongoos = require("mongoose");
const categorySchema = new mongoos.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    createdBy: {
      type: mongoos.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);
categorySchema.index(
  {
    name: 1,
  },
  { unique: true }
);

module.exports = mongoos.model("Category", categorySchema);
