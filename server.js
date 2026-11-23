require("dotenv").config();
const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Report = require("./models/Report");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" })); // photos are sent as base64
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/reports", require("./routes/reports"));

const SEED = [
  { ref: "587345jkDSUA485", id: "3450MultiMedia", name: "CARLO", handle: "@CABRAL_06", category: "Road Problems",
    location: "Tondo, Manila, Metro Manila.", text: "The road in Tondo is not looking great. Cars and Motorcycle having a hardtime to get through",
    date: "2020-12-19T10:24:00", status: "Reviewing", img: null, coords: [14.6179, 120.9667] },
  { ref: "912004xqLMWE771", id: "3451MultiMedia", name: "CARLO", handle: "@CABRAL_06", category: "Road Problems",
    location: "Ermita, Manila", text: "Large potholes near the intersection are causing heavy traffic every morning.",
    date: "2020-12-19T10:24:00", status: "Pending", img: null, coords: [14.5833, 120.9833] },
];

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected");
    if ((await Report.countDocuments()) === 0) {
      await Report.insertMany(SEED);
      console.log("Sample reports added");
    }
    app.listen(process.env.PORT, () => console.log(`Server running on http://localhost:${process.env.PORT}`));
  })
  .catch((err) => console.error("MongoDB connection error:", err.message));
