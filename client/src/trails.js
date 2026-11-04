// =====================================================================
// Heritage trails: 2 tarah ke
//   1. Featured (curated): haath se bane, stops ka naam places ke naam se match hota hai
//   2. Explore by region (auto): places ke "state" se region nikal kar apne aap bante hain
// =====================================================================

// ---------- 1. Curated trails ----------
export const CURATED_TRAILS = [
  {
    id: 'stepwells',
    title: 'Stepwells of Rajasthan & Gujarat',
    stops: ['Rani ki Vav', 'Chand Baori', 'Toorji ka Jhalra', 'Adalaj ki Vav'],
  },
  {
    id: 'forts',
    title: 'Forts of Rajasthan',
    stops: ['Mehrangarh Fort', 'Chittorgarh Fort', 'Kumbhalgarh Fort', 'Amber Fort', 'Jaisalmer Fort'],
  },
  {
    id: 'temples',
    title: 'Temples of South India',
    stops: ['Brihadeeswara Temple', 'Meenakshi Amman Temple'],
  },
]

// Curated trail mein kam se kam itne stops (database mein mile hue) ho tabhi dikhao
export const MIN_CURATED_STOPS = 2
// Region trail ke liye us region mein kam se kam itni jagahein chahiye
export const MIN_REGION_STOPS = 3

// ---------- 2. Region map: state -> region ----------
// Dikhane ka order yahi hai. Telangana ko Deccan mein rakha hai (Golconda, Charminar jaisi Deccan virasat).
export const REGIONS = [
  {
    key: 'north',
    title: 'North India',
    states: [
      'delhi', 'nct of delhi', 'new delhi', 'punjab', 'haryana', 'chandigarh', 'himachal pradesh',
      'uttarakhand', 'uttaranchal', 'uttar pradesh', 'jammu and kashmir', 'ladakh',
    ],
  },
  {
    key: 'west',
    title: 'West India',
    states: ['rajasthan', 'gujarat', 'goa', 'daman and diu', 'dadra and nagar haveli'],
  },
  {
    key: 'south',
    title: 'South India',
    states: ['tamil nadu', 'karnataka', 'kerala', 'andhra pradesh', 'puducherry', 'pondicherry', 'lakshadweep'],
  },
  {
    key: 'east',
    title: 'East India',
    states: ['odisha', 'orissa', 'west bengal', 'bihar', 'jharkhand'],
  },
  {
    key: 'central',
    title: 'Central India',
    states: ['madhya pradesh', 'chhattisgarh'],
  },
  {
    key: 'northeast',
    title: 'North-East India',
    states: [
      'assam', 'meghalaya', 'manipur', 'mizoram', 'nagaland', 'tripura', 'arunachal pradesh', 'sikkim',
    ],
  },
  {
    key: 'deccan',
    title: 'Deccan & Maharashtra',
    states: ['maharashtra', 'telangana'],
  },
]

// "Jammu & Kashmir " aur "jammu and kashmir" ek hi maane jaayein
function normalizeState(state) {
  return String(state ?? '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\s+/g, ' ')
    .trim()
}

const STATE_TO_REGION = new Map(
  REGIONS.flatMap((region) => region.states.map((state) => [state, region.key])),
)

// Place ka state kis region mein aata hai (nahi pata to null)
export function regionOf(state) {
  return STATE_TO_REGION.get(normalizeState(state)) ?? null
}

// ---------- Doori aur route order ----------
export function distanceKm(a, b) {
  const R = 6371
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

// Stops ko ek logical route mein lagao (zig-zag nahi):
// sabse uttar wali jagah se shuru, phir hamesha sabse paas wali agli jagah (nearest-neighbour),
// aur aakhir mein 2-opt se aise mod hata do jahan raasta khud ko kaat raha ho.
export function orderStops(places) {
  if (places.length < 3) return [...places].sort((a, b) => b.lat - a.lat)

  const start = places.reduce((best, p) => (p.lat > best.lat ? p : best))
  const route = [start]
  const remaining = places.filter((p) => p !== start)

  while (remaining.length) {
    const last = route[route.length - 1]
    let nearest = 0
    for (let i = 1; i < remaining.length; i++) {
      if (distanceKm(last, remaining[i]) < distanceKm(last, remaining[nearest])) nearest = i
    }
    route.push(remaining.splice(nearest, 1)[0])
  }

  // 2-opt (pehla stop fixed): kisi hisse ko ulta karne se raasta chhota hota ho to ulta kar do
  let improved = true
  let passes = 0
  while (improved && passes < 50) {
    improved = false
    passes++
    for (let i = 1; i < route.length - 1; i++) {
      for (let j = i + 1; j < route.length; j++) {
        const a = route[i - 1]
        const b = route[i]
        const c = route[j]
        const d = route[j + 1]
        const before = distanceKm(a, b) + (d ? distanceKm(c, d) : 0)
        const after = distanceKm(a, c) + (d ? distanceKm(b, d) : 0)
        if (after < before - 1e-6) {
          route.splice(i, j - i + 1, ...route.slice(i, j + 1).reverse())
          improved = true
        }
      }
    }
  }
  return route
}

// ---------- Trails banana ----------
// places (poori list) se: { featured: [...], regions: [...] }. Har trail: { id, title, stops: [place, ...] }
export function buildTrails(places) {
  const featured = CURATED_TRAILS.map((trail) => ({
    id: trail.id,
    title: trail.title,
    // Naam se jagahein dhoondo; jo database mein nahi hain unhe chhod do
    stops: trail.stops.map((name) => places.find((p) => p.naam === name)).filter(Boolean),
  })).filter((trail) => trail.stops.length >= MIN_CURATED_STOPS)

  const regions = REGIONS.map((region) => ({
    id: `region-${region.key}`,
    title: region.title,
    stops: orderStops(places.filter((p) => regionOf(p.state) === region.key)),
  })).filter((trail) => trail.stops.length >= MIN_REGION_STOPS)

  return { featured, regions }
}

// Region ke hisaab se kitni jagahein hain (report / jaanch ke liye)
export function regionSummary(places) {
  const summary = REGIONS.map((region) => ({
    key: region.key,
    title: region.title,
    count: places.filter((p) => regionOf(p.state) === region.key).length,
  }))
  const unmapped = places.filter((p) => regionOf(p.state) === null)
  return { summary, unmapped }
}
