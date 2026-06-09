// middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/user.js");

const protect = async (req, res, next) => {
  try {
      // Debug logs — temporary
      console.debug('DEBUG auth: cookies=', req.cookies);

      const authHeader = req.headers.authorization;

      console.debug('DEBUG auth: authHeader=', authHeader);

      // check for token in cookie first, otherwise support Authorization header
      const token = req.cookies?.token || (authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null);


      if (!token) {
        console.debug('DEBUG auth: no token found');
        return res.status(401).json({
          success: false,
          message: "Not authorized. Please login first.",
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // if token is fake or expired, this throws an error → caught below

      // find the user from the id stored inside the token
      const user = await User.findById(decoded.id);

      console.debug('DEBUG auth: decoded id=', decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User no longer exists.",
        });
      }

      // attach user to req so route handlers can use it
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