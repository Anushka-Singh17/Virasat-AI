const express = require("express");
const multer = require("multer");
const { GoogleGenAI } = require("@google/genai");
const Place = require("../models/Place");

const router = express.Router();

// Photo multer ki memory mein rakhte hain (disk par nahi), max 8MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

// Gemini client: key na ho to server crash nahi karega, bas error dega
let ai = null;
function getAi() {
  if (!ai && process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
}

// Gemini ko ye JSON format dene ko kehte hain. Pakka na pata ho to "unknown" likhne ka rule hai.
const PROMPT = `
Tum ek Indian heritage expert ho. Di gayi image dekh kar sirf JSON return karo, koi aur text nahi.

Rules:
- Jo pakka na pata ho use "unknown" likho. Kuch bhi guess mat karo.
- Agar sirf visible features ke aadhaar par andaza lagana ho to use "geminiInfo" mein "Guess:" se shuru karke likho.
- Location (lat, lng) sirf tab do jab image mein sach mein pata ho, warna null.

Agar mode "place" hai (koi heritage jagah ki photo), to ye JSON do:
{
  "identified": true/false,
  "naam": "jagah ka naam ya unknown",
  "type": "baoli" | "kila" | "mandir" | "other",
  "state": "Indian state ka naam ya unknown",
  "lat": number ya null,
  "lng": number ya null,
  "geminiInfo": "history ya guess (guess ho to 'Guess:' se shuru)",
  "translation": ""
}

Agar mode "document" hai (Devanagari ya Hindi dastavez), to ye JSON do:
{
  "identified": true/false,
  "naam": "dastavez mein aayi main jagah ka naam ya unknown",
  "type": "baoli" | "kila" | "mandir" | "other",
  "state": "unknown ya state",
  "lat": number ya null,
  "lng": number ya null,
  "geminiInfo": "",
  "translation": "dastavez ka English translation"
}
`;

// Gemini ka text JSON mein badlo. Galat format ho to null (crash nahi).
function parseGeminiJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// Coordinates sahi range mein hain ya nahi (India ke aas-paas)
function validCoords(lat, lng) {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    lat >= 5 && lat <= 38 &&
    lng >= 66 && lng <= 99
  );
}

// Do points ke beech door (meters mein)
function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// 200m ke andar koi sthal database mein hai to wo dhoondho
async function findNearby(lat, lng) {
  // Pehle ek chhota box (index ka fayda), phir sahi distance check
  const dLat = 0.002; // lagbhag 220m
  const dLng = 0.002 / Math.cos((lat * Math.PI) / 180);
  const candidates = await Place.find({
    lat: { $gte: lat - dLat, $lte: lat + dLat },
    lng: { $gte: lng - dLng, $lte: lng + dLng },
  }).lean();

  let best = null;
  let bestDist = 200;
  for (const p of candidates) {
    const d = distanceMeters(lat, lng, p.lat, p.lng);
    if (d <= bestDist) {
      best = p;
      bestDist = d;
    }
  }
  return best;
}

// POST /api/analyze -> multipart: image (file), mode, lat, lng (optional)
router.post("/", (req, res) => {
  upload.single("image")(req, res, async (uploadErr) => {
    if (uploadErr) {
      return res.status(400).json({ error: "Photo upload nahi ho paayi (max 8MB, sirf image)" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "Image bhejna zaroori hai" });
    }

    const mode = req.body.mode === "document" ? "document" : "place";
    const userLat = req.body.lat !== undefined ? Number(req.body.lat) : NaN;
    const userLng = req.body.lng !== undefined ? Number(req.body.lng) : NaN;
    const hasUserLocation = validCoords(userLat, userLng);

    try {
      // 1. Pehle database mein check karo (agar location hai)
      if (hasUserLocation) {
        const nearby = await findNearby(userLat, userLng);
        if (nearby) return res.json({ place: nearby, source: "database" });
      }

      // 2. Gemini se pucho
      const client = getAi();
      if (!client) {
        return res.status(500).json({ error: "GEMINI_API_KEY server mein set nahi hai" });
      }

      const response = await client.models.generateContent({
        model: "gemini-3.8-flash",
        contents: [
          {
            role: "user",
            parts: [
              { text: PROMPT + `\nMode: ${mode}` },
              {
                inlineData: {
                  mimeType: req.file.mimetype,
                  data: req.file.buffer.toString("base64"),
                },
              },
            ],
          },
        ],
        config: { responseMimeType: "application/json" },
      });

      const info = parseGeminiJson(response.text) || { identified: false };
      const identified = info.identified === true && info.naam && info.naam !== "unknown";

      // 3. Location: user ki location pehle, nahi to Gemini ki
      let lat = null;
      let lng = null;
      let locationSource = "";
      if (hasUserLocation) {
        lat = userLat;
        lng = userLng;
        locationSource = "user";
      } else if (validCoords(info.lat, info.lng)) {
        lat = info.lat;
        lng = info.lng;
        locationSource = "ai";
      }

      const source = identified ? "gemini" : "unknown";
      const fields = {
        naam: identified ? info.naam : mode === "document" ? "Dastavez (naam nahi pata)" : "Ajnaat sthal",
        type: ["baoli", "kila", "mandir", "other"].includes(info.type) ? info.type : "other",
        state: info.state && info.state !== "unknown" ? info.state : "",
        geminiInfo: info.geminiInfo || "",
        translation: info.translation || "",
        status: identified ? "verified" : "anjaan",
        locationSource: locationSource || undefined,
      };

      // 4. Jagah pata ho to save karo (pin banne ke liye lat/lng zaroori hai)
      if (lat !== null && lng !== null) {
        const place = await Place.create({ ...fields, lat, lng });
        return res.json({ place, source });
      }

      // Jagah nahi pata: save nahi karte, frontend user se location poochega
      return res.json({ place: { ...fields, lat: null, lng: null }, source });
    } catch (err) {
      console.log("Analyze error ❌", err.message);
      return res.status(502).json({ error: "AI check nahi kar paya, baad mein try karein" });
    }
  });
});

module.exports = router;
