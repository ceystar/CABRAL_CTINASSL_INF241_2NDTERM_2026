const express = require("express");
const Report = require("../models/Report");
const router = express.Router();

const rnd = (n, chars) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
const newRef = () => rnd(6, "0123456789") + rnd(2, "abcdefghijk") + rnd(4, "ABCDEFGHJKLMNPQRSTUVWXYZ") + rnd(3, "0123456789");

// CREATE
router.post("/", async (req, res) => {
  try {
    const { category, location, text, img, coords, name, handle } = req.body;
    const report = await Report.create({
      ref: newRef(),
      id: rnd(4, "0123456789") + "MultiMedia",
      name: (name || "USER").toUpperCase(),
      handle: handle || "@user",
      category, location, text, img: img || null, coords,
      status: "Pending",
    });
    res.status(201).json(report);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// READ ALL (supports ?status=Pending&search=road)
router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      const rx = new RegExp(req.query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ ref: rx }, { category: rx }, { location: rx }, { text: rx }];
    }
    const reports = await Report.find(filter).sort({ date: -1 });
    res.status(200).json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// READ ONE (by reference code)
router.get("/:ref", async (req, res) => {
  try {
    const report = await Report.findOne({ ref: req.params.ref });
    if (!report) return res.status(404).json({ message: "Report not found" });
    res.status(200).json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE (status, category, location, text)
router.put("/:ref", async (req, res) => {
  try {
    const allowed = ["status", "category", "location", "text"];
    const update = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
    const report = await Report.findOneAndUpdate({ ref: req.params.ref }, update, { new: true, runValidators: true });
    if (!report) return res.status(404).json({ message: "Report not found" });
    res.status(200).json(report);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE
router.delete("/:ref", async (req, res) => {
  try {
    const report = await Report.findOneAndDelete({ ref: req.params.ref });
    if (!report) return res.status(404).json({ message: "Report not found" });
    res.status(200).json({ message: "Report deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
