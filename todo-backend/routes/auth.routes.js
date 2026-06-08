// routes/auth.routes.js
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

// helper — creates a JWT token for a user
function generateToken(userId) {
    return jwt.sign(
      { id: userId },            // payload — what we store inside the token
      process.env.JWT_SECRET,    // secret key — used to sign + verify
      { expiresIn: process.env.JWT_EXPIRE || "7d" } // token expires in 7 days
    );
}

// ─── REGISTER ────────────────────────────────────────────────
// POST /api/auth/register
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // 1. validate fields
        if (!name || !email || !password) {
            return res.status(400).json({
              success: false,
              message: "Please provide name, email and password",
            });
        }

        // 2. check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
              success: false,
              message: "Email already registered. Please login.",
            });
        }

        // 3. create user — password is hashed automatically by pre-save hook
        const user = await User.create({ name, email, password });

        // 4. generate token
        const token = generateToken(user._id);

        // 5. send back token + user info (never send password)
        res.status(201).json({
            success: true,
            message: "Account created successfully",
            token,
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

// ─── LOGIN ────────────────────────────────────────────────────
// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. validate fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // 2. find user by email
    const user = await User.findOne({ email });

    // 3. check user exists AND password matches
    // we use the same message for both — don't reveal which one is wrong
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 4. generate token
    const token = generateToken(user._id);

    // 5. send token + user info
    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      token,
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

// ─── GET CURRENT USER ────────────────────────────────────────
// GET /api/auth/me  (protected)
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

module.exports = router;