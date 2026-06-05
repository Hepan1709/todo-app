const express = require("express");
const cors = require("cors");
const todoRoutes = require("./routes/route.js"); 

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/todos", todoRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

module.exports = app;