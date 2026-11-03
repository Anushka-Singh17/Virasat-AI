require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
// Photo base64 mein badi hoti hai, isliye body limit 5MB rakhi hai
app.use(express.json({ limit: "5mb" }));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected ✅"))
  .catch((err) => console.log("MongoDB error ❌", err.message));

app.get("/", (req, res) => {
  res.send("Server is working");
});

// Places ke routes (GET, POST, PUT /api/places)
app.use("/api/places", require("./routes/places"));

// Stats (GET /api/stats)
app.use("/api/stats", require("./routes/stats"));

// Photo/document analyze (POST /api/analyze)
app.use("/api/analyze", require("./routes/analyze"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});