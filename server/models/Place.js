const mongoose = require("mongoose");

// Ek heritage sthal (stepwell, kila, mandir, ya koi aur jagah)
const placeSchema = new mongoose.Schema(
  {
    naam: { type: String, required: true, trim: true },

    // Map par pin kahan hai
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },

    type: {
      type: String,
      enum: ["baoli", "kila", "mandir", "other"],
      default: "other",
    },
    state: { type: String, default: "", trim: true },

    // Photo URL ya base64 string (dono chal sakte hain)
    photo: { type: String, default: "" },

    // Gemini ne jo bataya (sirf guess ho to wahi likha hoga)
    geminiInfo: { type: String, default: "" },
    translation: { type: String, default: "" },

    // Itihaas aur banane wale ki jaankari
    history: { type: String, default: "" },
    builtBy: { type: String, default: "" },
    era: { type: String, default: "" },

    // Jaankari kahan se aayi (URLs ya source ke naam)
    sources: { type: [String], default: [] },

    // Location kahan se li gayi: exif (photo ka GPS), ai (Gemini), ya user (map par chuna)
    locationSource: { type: String, enum: ["exif", "ai", "user"] },

    // User ne jo likha
    userKahani: { type: String, default: "" },
    contributorName: { type: String, default: "" },

    // anjaan = koi jaankari nahi, community = user ne kahani di, verified = pakka
    status: {
      type: String,
      enum: ["anjaan", "community", "verified"],
      default: "anjaan",
    },
  },
  { timestamps: true } // createdAt aur updatedAt apne aap bante hain
);

// Nearby search (200m) ke liye lat/lng par index
placeSchema.index({ lat: 1, lng: 1 });

module.exports = mongoose.model("Place", placeSchema);
