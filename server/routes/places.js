const express = require("express");
const mongoose = require("mongoose");
const Place = require("../models/Place");

const router = express.Router();

// Client se sirf ye fields lenge (status client se nahi, server set karega)
const ALLOWED_FIELDS = [
  "naam",
  "lat",
  "lng",
  "type",
  "state",
  "photo",
  "geminiInfo",
  "translation",
  "userKahani",
  "history",
  "builtBy",
  "era",
  "sources",
  "locationSource",
  "contributorName",
];

function pickFields(body) {
  const data = {};
  for (const field of ALLOWED_FIELDS) {
    if (body[field] !== undefined) data[field] = body[field];
  }
  return data;
}

// GET /api/places -> saari jagahein
router.get("/", async (req, res) => {
  try {
    const places = await Place.find().sort({ createdAt: 1 }).lean();
    res.json(places);
  } catch (err) {
    res.status(500).json({ error: "Jagahein load nahi ho paayi" });
  }
});

// POST /api/places -> nayi jagah save karo (status hamesha "anjaan" se shuru hota hai)
router.post("/", async (req, res) => {
  try {
    const place = await Place.create(pickFields(req.body));
    res.status(201).json(place);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/places/:id -> user ne info di, to status "community" ho jaata hai
router.put("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Galat id" });
  }

  try {
    const updates = pickFields(req.body);
    updates.status = "community";

    const place = await Place.findByIdAndUpdate(req.params.id, updates, {
      returnDocument: "after", // updated document wapas do
      runValidators: true,
    }).lean();

    if (!place) return res.status(404).json({ error: "Jagah nahi mili" });
    res.json(place);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
