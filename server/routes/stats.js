const express = require("express");
const Place = require("../models/Place");

const router = express.Router();

// GET /api/stats -> { total, verified, unknown }
router.get("/", async (req, res) => {
  try {
    // Teeno ginti ek saath karo
    const [total, verified, unknown] = await Promise.all([
      Place.countDocuments(),
      // Community wale sthal bhi green pin hain, isliye unhe bhi verified mein ginte hain
      Place.countDocuments({ status: { $in: ["verified", "community"] } }),
      Place.countDocuments({ status: "anjaan" }),
    ]);
    res.json({ total, verified, unknown });
  } catch (err) {
    res.status(500).json({ error: "Stats load nahi ho paaye" });
  }
});

module.exports = router;
