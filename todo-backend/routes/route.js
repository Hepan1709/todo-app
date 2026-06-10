const express = require("express");
const router = express.Router();
const Todo = require("../models/model.js");
const protect = require("../middleware/auth.js");

router.use(protect);

router.get("/", async (req, res) => {
  try {
    const { done, search, sortBy, status, page = 1, limit = 10 } = req.query;

    const filter = { user: req.user._id };

    if (search) {
      filter.text = { $regex: search, $options: "i" };
    }

    // support status filter (preferred). If status provided, filter by it.
    if (status) {
      filter.status = status;

    } else if (typeof done !== "undefined" && done !== "") {

      // backwards-compatible: parse done as boolean string
      if (done === "true") filter.done = true;

      else if (done === "false") filter.done = false;
    }

    let sortOption = { createdAt: -1 };

    if (sortBy === "dueDate") {
      sortOption = { dueDate: 1 };
    }

    if (sortBy === "oldest") {
      sortOption = { createdAt: 1 };
    }

    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const pageLimit = Math.max(parseInt(limit, 10) || 10, 1);
    const skip = (pageNumber - 1) * pageLimit;

    const totalCount = await Todo.countDocuments(filter);
    const totalPages = Math.max(Math.ceil(totalCount / pageLimit), 1);

    let todos;

    if (sortBy === "dueDate") {
      // use aggregation to place null dueDate items last and paginate after sorting
      todos = await Todo.aggregate([
        { $match: filter },
        { $addFields: { dueDateOrder: { $cond: [ { $eq: ["$dueDate", null] }, 1, 0 ] } } },
        { $sort: { dueDateOrder: 1, dueDate: 1 } },
        { $skip: skip },
        { $limit: pageLimit },
      ]);
    } else {
      todos = await Todo.find(filter).sort(sortOption).skip(skip).limit(pageLimit);
    }

    res.status(200).json({
      success: true,
      count: todos.length,
      totalCount,
      page: pageNumber,
      totalPages,
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
      { _id: req.params.id, user: req.user._id }, 
      req.body,                                    
      { new: true, runValidators: true }           
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
      user: req.user._id, 
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