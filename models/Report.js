const mongoose = require("mongoose");

const CATEGORIES = ["Road Problems", "Flooding / Drainage", "Streetlight Outage", "Garbage / Sanitation", "Public Safety Hazard", "Other"];
const STATUSES = ["Pending", "Reviewing", "Resolved"];

const reportSchema = new mongoose.Schema({
  ref: { type: String, required: true, unique: true },
  id: { type: String, required: true },
  name: { type: String, required: true },
  handle: { type: String, required: true },
  category: { type: String, required: [true, "Category is required"], enum: { values: CATEGORIES, message: "Invalid category" } },
  location: { type: String, required: [true, "Location is required"], trim: true },
  text: { type: String, required: [true, "Description is required"], trim: true, minlength: [10, "Description must be at least 10 characters"], maxlength: [300, "Description must be at most 300 characters"] },
  status: { type: String, enum: { values: STATUSES, message: "Invalid status" }, default: "Pending" },
  img: { type: String, default: null },
  coords: { type: [Number], default: undefined },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Report", reportSchema);
