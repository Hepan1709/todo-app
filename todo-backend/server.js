require("dotenv").config();
const app = require("./app.js");
const connectDB = require("./config/database.js");

const PORT = process.env.PORT || 8000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});