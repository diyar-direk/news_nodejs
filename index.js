require("dotenv").config();
const express = require("express");
const app = express();
const url = process.env.MONGODB_URL;
const port = process.env.PORT || 8000;
const cors = require("cors");
const mongoose = require("mongoose");
mongoose.connect(url).then(() => {
  console.log("connected mongodb");
});
app.use(cors());
app.use(express.json());
const usersRouter = require("./router/usersRouter");

app.use("/api/users", usersRouter);

app.use((req, res) => {
  res.status(404).json({
    message: "no route found",
    data: null,
    code: 404,
  });
});

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
