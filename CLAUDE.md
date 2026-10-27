# Project: Heritage Map (Hackathon, deadline: tomorrow)

## Context
I'm building this solo for a 1-day hackathon (problem code: C26-CULT01). I know the MERN stack
(I've built an ecommerce site) but I'm a beginner. I want a FRESH, clean project that I can put on
my resume and explain in interviews. Explain each step briefly in simple Hinglish.

## Problem statement
India's cultural heritage data (photos of stepwells/forts, regional-language Devanagari documents,
travel notes) is trapped in PPTs, Drive folders and PDFs, so nobody can search, visualise or interact
with it. Build a solution that makes this data interactive, searchable and visual.
Also, many small local heritage sites have NO information online at all, not even on Google.

## My solution
A crowdsourced heritage-mapping web app:
1. Interactive map of India with pins for heritage sites. Clicking a pin shows photo, history, story.
2. Search bar that filters pins by name/type/state.
3. Upload a photo of a heritage place OR a Devanagari/Hindi document:
   - Read GPS from photo EXIF (exifr) if available.
   - First check MongoDB for an existing place near that location (within ~200 m).
   - If not found, send the image to Gemini API. For a place photo: identify it, give history.
     For a document: OCR + translate to English + extract place names. Gemini must return STRICT JSON
     and must say "unknown" instead of guessing; if unsure it may describe visible features as a guess,
     clearly labelled as a guess.
   - Save result to MongoDB and add the pin to the map.
4. If Gemini doesn't know the place → save it with status "anjaan" (yellow pin) and show an
   "Add info" form so any user can add name/story. Then status becomes "verified" (green pin).

## Tech stack (JavaScript only)
- client/: React + Vite, react-leaflet + leaflet (OpenStreetMap tiles), axios, exifr, plain CSS or Tailwind
- server/: Node + Express, Mongoose (MongoDB Atlas), multer (memory storage), cors, dotenv,
  @google/genai (model: gemini-2.5-flash)
- Secrets ONLY in server/.env (MONGO_URI, GEMINI_API_KEY, PORT). Never put the API key in frontend.
  Add .env and node_modules to .gitignore.

## Data model: Place
naam, lat, lng, type (baoli/kila/mandir/other), state, photo (base64 or URL), geminiInfo,
translation (for documents), userKahani, status ("anjaan" | "verified"), timestamps

## API routes
- GET  /api/places          → all places
- POST /api/places          → create place
- PUT  /api/places/:id      → add user info, set status "verified"
- POST /api/analyze         → multipart image (+ optional lat/lng, mode: "place" | "document")
                              → DB nearby check → Gemini → return JSON

## Also needed
- A seed script with 15-20 real Indian heritage sites (stepwells, forts) with correct lat/lng.
- Simple, clean, good-looking UI (heritage theme: warm sandstone colours).
- README with problem, features, screenshots placeholder, tech stack, setup steps.
- Deploy-ready: client on Vercel, server on Render (use env var for API base URL).

## How to work with me
Work milestone by milestone. After each milestone: tell me in 2-3 lines what you built,
how to run/test it, then STOP and wait for my "ok, next".
Suggest a git commit message after each milestone.

Milestones:
1. Project setup (both folders, packages, .env.example, .gitignore)
2. Express server + MongoDB connection + Place model + CRUD routes + seed script
3. React map showing pins from API (yellow for anjaan, green for verified) + popup
4. Search bar filtering
5. /api/analyze with Gemini + upload UI (place photo and document modes)
6. "Add info" form for anjaan places
7. UI polish + README + deployment steps

Priority: a WORKING demo over extra features. Keep code simple and readable.