// middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/user.js");

const protect = async (req, res, next) => {
  try {
      // 1. check if token exists in headers
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          success: false,
          message: "Not authorized. Please login first.",
        });
      }

      // 2. extract token — "Bearer eyJhbG..." → "eyJhbG..."
      const token = authHeader.split(" ")[1];

      // 3. verify the token using our secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // if token is fake or expired, this throws an error → caught below

      // 4. find the user from the id stored inside the token
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User no longer exists.",
        });
      }

      // 5. attach user to req so route handlers can use it
      req.user = user;
      // now in any protected route: req.user._id, req.user.name, req.user.email

      next(); 

  } catch (error) {
      
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token. Please login again.",
      });
  }
};

module.exports = protect;