const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const todoRoutes = require("./routes/route.js");
const authRoutes = require("./routes/auth.routes.js");

const app = express();

const allowedOrigins = ["http://localhost:5173", "http://localhost:5174"];
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/todos", todoRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

module.exports = app;