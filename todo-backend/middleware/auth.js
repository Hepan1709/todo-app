// middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/user.js");

const protect = async (req, res, next) => {
  try {
      // 1. check if token exists in cookies
      const token = req.cookies.token;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Not authorized. Please login first.",
        });
      }

      // 2. verify the token using our secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // if token is fake or expired, this throws an error → caught below

      // 3. find the user from the id stored inside the token
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User no longer exists.",
        });
      }

      // 4. attach user to req so route handlers can use it
      req.user = user;
      // now in any protected route: req.user._id, req.user.name, req.user.email

      next(); // all checks passed → continue to route handler

  } catch (error) {
      // jwt.verify throws if token is invalid or expired
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token. Please login again.",
      });
  }
};

module.exports = protect;