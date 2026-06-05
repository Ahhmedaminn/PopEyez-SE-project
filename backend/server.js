const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", function (req, res) {
  res.send("PopEyez backend is running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, function () {
  console.log("Server running on http://localhost:" + PORT);
});