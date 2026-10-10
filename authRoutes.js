import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import auth from "../middleware/auth.js";

const router = Router();

function makeToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
}

router.post("/register", async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (name.length < 2) return res.status(400).json({ message: "Name must contain at least 2 characters." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: "Enter a valid email address." });
    if (password.length < 6) return res.status(400).json({ message: "Password must contain at least 6 characters." });
    if (await User.findOne({ email })) return res.status(409).json({ message: "An account with this email already exists." });
    const hash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hash });
    res.status(201).json({ token: makeToken(user._id.toString()), user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) { next(err); }
});

router.post("/login", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Email or password is incorrect." });
    }
    res.json({ token: makeToken(user._id.toString()), user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) { next(err); }
});

router.get("/me", auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select("name email");
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) { next(err); }
});

export default router;
