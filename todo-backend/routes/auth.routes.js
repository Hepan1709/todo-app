// routes/auth.routes.js
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/user.js");


function generateToken(userId) {
    return jwt.sign(
      { id: userId },            
      process.env.JWT_SECRET,    
      { expiresIn: process.env.JWT_EXPIRE || "7d" } 
    );
}

function setAuthCookie(res, token) {
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "none",
      path: "/",
      maxAge,
      secure: true, // required for SameSite=None in modern browsers, localhost is treated as secure
    });
}

router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
              success: false,
              message: "Please provide name, email and password",
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
              success: false,
              message: "Email already registered. Please login.",
            });
        }

        // create user — password is hashed automatically by pre-save hook
        const user = await User.create({ name, email, password });

     
        const token = generateToken(user._id);
        setAuthCookie(res, token);


        res.status(201).json({
            success: true,
            message: "Account created successfully",
            user: {
              _id: user._id,
              name: user.name,
              email: user.email,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});


router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    
    const user = await User.findOne({ email });

 
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }


    const token = generateToken(user._id);
    setAuthCookie(res, token);


    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


const protect = require("../middleware/auth");

router.get("/me", protect, async (req, res) => {
  // req.user is set by protect middleware
  res.status(200).json({
    success: true,
    user: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
    },
  });
});

router.post("/logout", protect, async (req, res) => {
  res.clearCookie("token", { path: "/" });
  res.status(200).json({ success: true, message: "Logged out successfully" });
});

module.exports = router;