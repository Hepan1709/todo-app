const express = require("express");
const router = express.Router();
const Todo = require("../models/model.js");
const protect = require("../middleware/auth.js");

router.use(protect);

router.get("/", async (req, res) => {
  try {
    const {done , search , sortBy } = req.query;

    const filter = { user: req.user._id };

    if (search) {
      filter.text = { $regex: search, $options: "i" };
    }
    if (done === "true") {
      filter.done = done === true;
    }

    let sortOption = { createdAt: -1 };
    if (sortBy === "dueDate"){
      sortOption = { dueDate: 1 };
    }
    if (sortBy === "oldest"){
      sortOption = { createdAt: 1 };
    }

    const todos = await Todo.find(filter).sort(sortOption);
    res.status(200).json({
      success: true,
      count: todos.length,
      data: todos,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


router.get("/:id", async (req, res) => {
  try {
    const todo = await Todo.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: "Todo not found",
      });
    }

    res.status(200).json({ success: true, data: todo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


router.post("/", async (req, res) => {
  try {
    const { text , dueDate } = req.body;

    
    if (!text || text.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Todo text is required",
      });
    }

    const newTodo = await Todo.create({ text , dueDate: dueDate || null , user: req.user._id }); 

    res.status(201).json({
      success: true,
      message: "Todo created successfully",
      data: newTodo,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


router.put("/:id", async (req, res) => {
  try {
    const todo = await Todo.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id }, // filter
      req.body,                                    // what to update
      { new: true, runValidators: true }           // options
    );

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: "Todo not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Todo updated successfully",
      data: todo,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


router.delete("/:id", async (req, res) => {
  try {
    const todo = await Todo.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id, // can only delete YOUR own todos
    });

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: "Todo not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Todo deleted successfully",
      data: todo,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;