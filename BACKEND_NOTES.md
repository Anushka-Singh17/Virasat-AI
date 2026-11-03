# Virasat AI: Backend Notes (Anushka's ideas + decisions)

> Is file ko project ke root folder mein rakho (`Heritage-project/BACKEND_NOTES.md`).
> Backend shuru karte waqt yahin se ek-ek cheez tick karte jaana. ✅

---

## 0. Order + current status (updated 3 Nov 2026)

- [x] Local MongoDB (`mongodb://127.0.0.1:27017/virasat`) → `server/.env` mein `MONGO_URI`, `PORT=5000`, `GEMINI_API_KEY`
- [x] Server ko DB se jodo (`mongoose.connect`), khud likha ✍️
- [x] `Place` model (neeche saare fields), tested
- [x] Places routes: GET / POST / PUT, tested with curl
- [x] `/api/stats` route, tested
- [x] Seed script (`npm run seed`): 40 jagahein, duplicate nahi banata
- [~] `/api/analyze` route (Gemini) 🌟 code bana, DB wala case pass; Gemini test atka (503 / model naam check karna)
- [ ] **Frontend se jodo (abhi yahi karna hai)**, chhote tukdon mein:
  - [ ] Tukda 1: `express.json({ limit: "5mb" })` + `VITE_USE_MOCK=false` → map par 40 asli pins + asli stats
  - [ ] Tukda 2: `builtInfo` → `builtBy` + `era`; `community` status bhi hara pin
  - [ ] Tukda 3: "Add hidden place" form → POST → refresh ke baad bhi pin rahe
  - [ ] Tukda 4: Gemini: model `.env` se (`GEMINI_MODEL`), retry on 503/429, friendly error, time log
- [ ] Socket.io server (`io.emit`), agar time bache
- [ ] Deploy: DB → Atlas (sirf `MONGO_URI` badlega), server → Render, client → Vercel
- [ ] Commit + push har step ke baad 📸

### Gemini model note ⚠️
- `gemini-3.8-flash` naam confirm nahi hua. Apni key se list check karo (sirf apne laptop par):
  `https://generativelanguage.googleapis.com/v1beta/models?key=TUMHARI_KEY`
- List mein dikhe to alias `gemini-flash-latest` sabse safe hai.
- 503 = Google ka model busy (temporary). 404 = model naam galat.

### Status values (final)
`anjaan` 🟡 → `community` 🟢 (user ne info di) → `verified` 🟢 (confirmed)

---

## 1. Place model: saare fields

```js
naam:            String  (default "Anjaan Jagah")
lat, lng:        Number  (required)
type:            String  ("baoli" | "kila" | "mandir" | "other")
state:           String
photo:           String  (URL ya base64)
photos:          [String] (extra photos, "Add info" / "Add hidden place" form se)

// AI se
geminiInfo:      String  (Gemini ne jo bataya)
translation:     String  (document mode mein English translation)

// Logon se (crowdsourcing)
userKahani:      String  (kahani / folklore)
history:         String  (history)
builtBy:         String  (kisne banwaya, optional)
era:             String  (kab bana, optional)
sources:         [String] (research ke sources: kitaab, website, "buzurgon se suna")
contributorName: String  (credit: "Story added by ...")

// Status / meta
status:          String  ("anjaan" | "community" | "verified")
                 anjaan    = 🟡 koi info nahi, help needed
                 community = 🟢 kisi ne info add ki, abhi verify nahi hui
                 verified  = 🟢 confirmed
locationSource:  String  ("exif" | "ai" | "user")
timestamps:      true    (createdAt, updatedAt apne aap; activity feed ke liye kaam aayega)
```

---

## 2. Routes (frontend ke saath "contract", naam mat badalna)

| Method | Route | Kaam |
|---|---|---|
| GET  | `/api/places` | Saari jagahein (map ke pins) |
| POST | `/api/places` | Nayi jagah save ("Add a hidden heritage place" form) |
| PUT  | `/api/places/:id` | Info add karo ("I know this place, add its story"); status badlo |
| GET  | `/api/stats` | `{ total, verified, unknown }` via `countDocuments()` |
| POST | `/api/analyze` | Photo/document → DB check → Gemini → `{ place, source }` |

`source` = `"database"` | `"gemini"` | `"unknown"`

Baad mein (optional):
- GET `/api/activity`: latest 10 jagahein (`sort({ updatedAt: -1 }).limit(10)`), activity feed ke liye

---

## 3. `/api/analyze` flow (Gemini)

```
Photo upload (multer, memory storage)
  ↓
lat/lng aaya? (frontend ne EXIF se bheja)
  ↓ haan → DB mein ~200m ke andar koi jagah hai? → hai to wahi bhejo (source: "database") ⚡
  ↓ nahi mili
Gemini ko photo bhejo (@google/genai, model: .env ka GEMINI_MODEL)
  - mode "place":    "Ye kaunsi jagah hai? naam, state, type, history, lat/lng do"
  - mode "document": "OCR karo, English mein translate karo, jagahon ke naam + lat/lng nikalo"
  - Prompt mein ZAROOR: "Sirf JSON mein jawab do. Pakka nahi pata to 'unknown' bolo, kuch mat banao.
    Naam na pata ho to photo mein jo dikh raha hai uske basis par andaza do, aur saaf likho ki andaza hai."
  - 503/429 aaye → 2 baar retry → phir bhi fail → friendly error, server crash nahi
  ↓
Gemini ne pehchaana → save, status "verified" ya "community", locationSource "ai" (source: "gemini")
Gemini ko nahi pata → save, status "anjaan" 🟡 (source: "unknown")
```

API key sirf `server/.env` mein. Frontend mein KABHI nahi. 🔐

---

## 4. Location: 3-step fallback (Anushka ka idea)

1. Photo ka EXIF GPS → `locationSource: "exif"`
2. Nahi mila → Gemini ki lat/lng → `locationSource: "ai"`
3. Nahi mila → user "Use my current location" ya "Map par chuno" → `locationSource: "user"`

Note: Internet/WhatsApp wali photos mein GPS nahi hota (EXIF hata diya jaata hai). Ye bug nahi hai.

---

## 5. Crowdsourcing ideas (Anushka ke)

- **Do raaste:**
  - 📸 Upload → AI pehchaane (jiske paas photo hai)
  - ✍️ "Add a hidden heritage place" form → insaan likhe (researchers, gaon wale, travellers)
- **"I know this place, add its story"** button anjaan jagahon par
- **Sources field** zaroori: info kahan se aayi, taaki verify ho sake
- Nayi info pehle **"community"** status mein; verify baad mein
- Credit: "Story added by <naam>"
- Form simple: 6-7 fields max

Future:
- 3 log "✅ sahi hai" dabayein → verified (ya admin approve)
- Points/badges ("Heritage Explorer 🏅")
- Paas wale users ko notification: "Aapke paas ek anjaan jagah hai"

---

## 6. Search: poora India kaise cover hoga

- **Filter sirf wahi dhoondhta hai jo data mein pehle se hai** (naya data nahi laata).
- Isliye data **database** mein, code ke array mein nahi.
- Search 2 jagah dekhega:
  - 🟢🟡 Apna MongoDB: logon ki add ki hui jagahein (jo kahin aur nahi hain)
  - 🔵 OpenStreetMap (Nominatim + Overpass, frontend se live): duniya pehle se jo jaanti hai
- Baad mein: **seed script** → OSM/Wikidata se hazaaron jagahein MongoDB mein.
  Jab pins bahut ho jaayein, sirf visible map area ka data maango (bounds query).

---

## 7. Live / real-time

- Abhi: frontend har 30 sec `/api/stats` refresh (polling)
- Socket.io (time ho to):
  ```js
  const http = require("http");
  const { Server } = require("socket.io");
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: "*" } });
  // POST /api/places ke baad:   io.emit("newPlace", place)
  // PUT  /api/places/:id ke baad: io.emit("placeVerified", place)
  server.listen(PORT);   // app.listen ki jagah
  ```
  Frontend already in events ko sun raha hai: `newPlace`, `placeVerified`.
- Yaad: `emit` = bolna 📢, `on` = sunna 👂. Polling = chitthi ✉️, WebSocket = phone call 📞.

---

## 8. Chhoti fixes jo yaad rakhni hain

- `app.listen(PORT, () => ...)`: callback mein `(req, res)` nahi aata
- `"Servre"` → `"Server"` typo
- `cors()` lagana, warna React (5173) aur Node (5000) baat nahi karenge
- `.env` aur `node_modules` `.gitignore` mein (already done ✅)
- Map: official India boundary dhyan rakhna (OSM default border alag dikhata hai)

---

## 9. Pro hackathon backend rules 🏆

1. Contract pehle (routes + data shape)
2. Walking skeleton: pehle ek route (GET places) frontend se jodo, phir baaki
3. Ek feature = poori line (UI → API → DB → UI), phir agla
4. Har route turant test (curl / browser)
5. Bahar ki API par bharosa mat karo: retry + fallback + demo safety net
6. Backend boring rakho: no login, simple schema
7. Deploy jaldi karo
> "Pehle patli line jodo, phir moti karo."

---

## 10. Demo + pitch

- Demo photo: phone se, **camera location ON**, USB/email se laptop par (WhatsApp se nahi)
- Asli heritage jagah ki photo use karo (park nahi 😄)
- Unknown pins ke liye anjaan/gaon wali jagahein (mashhoor nahi)
- Backup demo video record karo
- Pitch lines:
  - "Main ek purani baoli gayi, Google pe uska naam tak nahi mila…"
  - "Google sirf wahi dikhata hai jo pehle se online hai. Virasat AI us jaankari ko online laata hai jo abhi tak kahin nahi thi."
  - "Jo jagah Google aur AI dono ke liye anjaan hai, humari website use duniya ke saamne laati hai."
- Future Scope slide: WebSockets, verification/badges, aur bhashayein, seed from OSM/Wikidata, poori duniya