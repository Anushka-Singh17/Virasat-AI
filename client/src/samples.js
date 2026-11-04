// "Try a sample": 3 demo photos (client/public/samples/, credits ATTRIBUTION.md mein) aur
// har ek ka pehle se likha hua AI jaisa result. AI/server na chale to yahi result dikhaya jaata hai.
// lat/lng seed data wali jagah ke barabar hain, taaki asli /api/analyze database mein wahi jagah dhoondh le.
export const SAMPLES = [
  {
    id: 'rani-ki-vav',
    image: '/samples/rani-ki-vav.jpg',
    label: 'Rani ki Vav',
    cached: {
      naam: 'Rani ki Vav',
      state: 'Gujarat',
      type: 'baoli',
      lat: 23.8588,
      lng: 72.1019,
      history:
        'An 11th-century stepwell in Patan, Gujarat, built in the Solanki era. Its walls are covered in hundreds of carved sculptures. A UNESCO World Heritage Site since 2014.',
    },
  },
  {
    id: 'hawa-mahal',
    image: '/samples/hawa-mahal.jpg',
    label: 'Hawa Mahal',
    cached: {
      naam: 'Hawa Mahal',
      state: 'Rajasthan',
      type: 'other',
      lat: 26.9239,
      lng: 75.8267,
      history:
        'A five-storey palace of pink and red sandstone in Jaipur, built in 1799 by Maharaja Sawai Pratap Singh. Its 953 small windows let royal women watch street life without being seen.',
    },
  },
  {
    id: 'chand-baori',
    image: '/samples/chand-baori.jpg',
    label: 'Chand Baori',
    cached: {
      naam: 'Chand Baori',
      state: 'Rajasthan',
      type: 'baoli',
      lat: 27.0,
      lng: 76.62,
      history:
        'A stepwell in Abhaneri village, Rajasthan, dating from around the 9th century. About 3,500 narrow steps descend over 13 levels in a striking geometric pattern.',
    },
  },
]

// Pehle se likha result ko wahi shape dena jo asli /api/analyze ka hota hai: { place, source }
export function cachedResult(sample) {
  const { naam, state, type, lat, lng, history } = sample.cached
  return {
    place: { naam, state, type, lat, lng, geminiInfo: history, translation: '', status: 'verified' },
    source: 'gemini',
    cached: true,
  }
}
