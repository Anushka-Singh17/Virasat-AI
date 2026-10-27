import axios from 'axios'
import { mockPlaces } from './mockData'

// .env se values aati hain (client mein koi secret nahi rakhna)
export const isMock = import.meta.env.VITE_USE_MOCK === 'true'
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const http = axios.create({ baseURL: API_URL })

// Mock mode mein data browser ki memory mein rehta hai (page reload par reset hota hai)
let mockStore = mockPlaces.map((p) => ({ ...p }))
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Do points ke beech door (meters mein), 200 m ke andar wali jagah ko "same" maanenge
function distanceMeters(a, b) {
  const R = 6371000
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export async function getPlaces() {
  if (isMock) {
    await wait(400)
    return mockStore.map((p) => ({ ...p }))
  }
  const { data } = await http.get('/api/places')
  return data
}

// Real mode only: backend se counts lo ({ total, verified, unknown })
export async function getStats() {
  const { data } = await http.get('/api/stats')
  return data
}

export async function updatePlace(id, body) {
  if (isMock) {
    await wait(500)
    mockStore = mockStore.map((p) =>
      p._id === id ? { ...p, ...body, status: 'verified' } : p,
    )
    return { ...mockStore.find((p) => p._id === id) }
  }
  const { data } = await http.put(`/api/places/${id}`, body)
  return data
}

// file = photo/document, mode = "place" | "document", lat/lng = optional location
export async function analyzeImage({ file, mode, lat, lng }) {
  if (isMock) return mockAnalyze({ mode, lat, lng })

  const form = new FormData()
  form.append('image', file)
  form.append('mode', mode)
  if (lat != null && lng != null) {
    form.append('lat', lat)
    form.append('lng', lng)
  }
  const { data } = await http.post('/api/analyze', form)
  return data
}

// Fake /api/analyze: pehle archive check, phir random "AI" result
async function mockAnalyze({ mode, lat, lng }) {
  await wait(1500)

  if (lat != null && lng != null) {
    const nearby = mockStore.find(
      (p) => distanceMeters(p, { lat, lng }) <= 200,
    )
    if (nearby) return { place: { ...nearby }, source: 'database' }
  }

  const identified = Math.random() > 0.3
  const place = {
    _id: `m${Date.now()}`,
    naam: identified
      ? mode === 'document'
        ? 'Old document (mock)'
        : 'Identified heritage site (mock)'
      : 'Unknown place',
    lat: lat ?? 22.5,
    lng: lng ?? 79,
    type: 'other',
    state: '',
    photo: '',
    geminiInfo: identified && mode === 'place'
      ? 'Mock: this looks like a building in an old architectural style. (This is only a guess.)'
      : '',
    translation: identified && mode === 'document'
      ? 'Mock: This is the English translation of the Devanagari document.'
      : '',
    userKahani: '',
    status: identified ? 'verified' : 'anjaan',
    createdAt: new Date().toISOString(),
  }
  mockStore = [...mockStore, place]
  return { place, source: identified ? 'gemini' : 'unknown' }
}
