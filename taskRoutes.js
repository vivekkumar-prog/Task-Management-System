import { Router } from "express";
import mongoose from "mongoose";
import Task from "../models/Task.js";
import auth from "../middleware/auth.js";

const router = Router();
router.use(auth);
const statuses = ["Pending", "In Progress", "Completed"];
const priorities = ["Low", "Medium", "High"];

router.get("/", async (req, res, next) => {
  try {
    const query = { user: req.userId };
    if (statuses.includes(req.query.status)) query.status = req.query.status;
    if (priorities.includes(req.query.priority)) query.priority = req.query.priority;
    if (req.query.search) {
      const term = String(req.query.search).slice(0, 100);
      query.$or = [{ title: { $regex: term, $options: "i" } }, { description: { $regex: term, $options: "i" } }];
    }
    const tasks = await Task.find(query).sort({ createdAt: -1 });
    res.json({ tasks });
  } catch (err) { next(err); }
});

router.post("/", async (req, res, next) => {
  try {
    const title = String(req.body.title || "").trim();
    if (!title) return res.status(400).json({ message: "Task title is required." });
    if (title.length > 120) return res.status(400).json({ message: "Title cannot exceed 120 characters." });
    const status = req.body.status || "Pending";
    const priority = req.body.priority || "Medium";
    if (!statuses.includes(status)) return res.status(400).json({ message: "Invalid task status." });
    if (!priorities.includes(priority)) return res.status(400).json({ message: "Invalid task priority." });
    const task = await Task.create({
      user: req.userId, title, description: String(req.body.description || "").trim(),
      status, priority, dueDate: req.body.dueDate || null
    });
    res.status(201).json({ task });
  } catch (err) { next(err); }
});

router.param("id", (req, res, next, id) => {
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid task ID." });
  next();
});

router.get("/:id", async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.userId });
    if (!task) return res.status(404).json({ message: "Task not found." });
    res.json({ task });
  } catch (err) { next(err); }
});

router.put("/:id", async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.userId });
    if (!task) return res.status(404).json({ message: "Task not found." });
    if (req.body.title !== undefined) {
      const title = String(req.body.title).trim();
      if (!title) return res.status(400).json({ message: "Task title cannot be empty." });
      if (title.length > 120) return res.status(400).json({ message: "Title cannot exceed 120 characters." });
      task.title = title;
    }
    if (req.body.description !== undefined) task.description = String(req.body.description).trim();
    if (req.body.status !== undefined) {
      if (!statuses.includes(req.body.status)) return res.status(400).json({ message: "Invalid task status." });
      task.status = req.body.status;
    }
    if (req.body.priority !== undefined) {
      if (!priorities.includes(req.body.priority)) return res.status(400).json({ message: "Invalid task priority." });
      task.priority = req.body.priority;
    }
    if (req.body.dueDate !== undefined) task.dueDate = req.body.dueDate || null;
    await task.save();
    res.json({ task });
  } catch (err) { next(err); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!task) return res.status(404).json({ message: "Task not found." });
    res.json({ message: "Task deleted successfully." });
  } catch (err) { next(err); }
});

export default router;
