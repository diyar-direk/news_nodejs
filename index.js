require("dotenv").config();
const express = require("express");
const app = express();
const url = process.env.MONGODB_URL;
const port = process.env.PORT || 8000;
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const mongoose = require("mongoose");
mongoose.connect(url).then(() => {
  console.log("connected mongodb");
});
app.use(cors());
app.use(express.json());
const usersRouter = require("./router/usersRouter");
const categoriesRouter = require("./router/categoriesRouter");
const newsRouter = require("./router/newsRouter");
const commentRouter = require("./router/commentRouter");
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use("/images", express.static(path.join(__dirname, "public/images")));
app.use("/videos", express.static(path.join(__dirname, "public/videos")));
app.use("/api/users", usersRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/news", newsRouter);
app.use("/api/comments", commentRouter);

app.use((req, res) => {
  res.status(404).json({
    message: "rout not found",
    data: null,
    code: 404,
  });
});

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
