//Backend routes for authentication

const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const router = express.Router();

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const username = (req.body.username || "").trim();
    const password = req.body.password || "";
    if (username.length < 3) return res.status(400).json({ message: "Username must be at least 3 characters." });
    if (password.length < 4) return res.status(400).json({ message: "Password must be at least 4 characters." });
    const exists = await User.findOne({ username: new RegExp("^" + username.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", "i") });
    if (exists) return res.status(409).json({ message: "That username is taken. Try another one." });
    const user = await User.create({ username, password: await bcrypt.hash(password, 10) });
    res.status(201).json({ username: user.username });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const username = (req.body.username || "").trim();
    const password = req.body.password || "";
    if (!username || !password) return res.status(400).json({ message: "Enter your username and password." });
    const user = await User.findOne({ username: new RegExp("^" + username.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", "i") });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: "Wrong username or password. New here? Choose Register above." });
    res.status(200).json({ username: user.username });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
