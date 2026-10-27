import { useEffect, useMemo, useState } from 'react'
import Header from './components/Header'
import StatsBar from './components/StatsBar'
import SearchBar from './components/SearchBar'
import MapView from './components/MapView'
import PlaceDetail from './components/PlaceDetail'
import UploadPanel from './components/UploadPanel'
import { getPlaces, isMock } from './api'
import './App.css'

export default function App() {
  const [places, setPlaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [flyTarget, setFlyTarget] = useState(null)
  const [pickMode, setPickMode] = useState(false)
  const [location, setLocation] = useState(null)

  // App start hote hi places laao
  useEffect(() => {
    let ignore = false
    getPlaces()
      .then((data) => {
        if (!ignore) setPlaces(data)
      })
      .catch(() => {
        if (!ignore) {
          setLoadError('Backend is not running. Start the server, or set VITE_USE_MOCK=true in .env to view the demo.')
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })
    return () => {
      ignore = true
    }
  }, [])

  // Search + type filter dono ek saath lagte hain
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return places.filter((p) => {
      const typeOk = typeFilter === 'all' || p.type === typeFilter
      const textOk =
        !q || [p.naam, p.state, p.type].some((field) => field?.toLowerCase().includes(q))
      return typeOk && textOk
    })
  }, [places, query, typeFilter])

  const stats = {
    total: places.length,
    verified: places.filter((p) => p.status === 'verified').length,
    unknown: places.filter((p) => p.status === 'anjaan').length,
  }

  function focusPlace(place) {
    setSelected(place)
    setFlyTarget({ lat: place.lat, lng: place.lng, zoom: 13 })
  }

  function handleUpdated(updated) {
    setPlaces((prev) => prev.map((p) => (p._id === updated._id ? updated : p)))
    setSelected(updated)
  }

  function handleNewPlace(place) {
    setPlaces((prev) =>
      prev.some((p) => p._id === place._id)
        ? prev.map((p) => (p._id === place._id ? place : p))
        : [...prev, place],
    )
    focusPlace(place)
  }

  function handleMapPick(loc) {
    setLocation(loc)
    setPickMode(false)
  }

  function togglePick() {
    setPickMode((on) => !on)
    // Mobile par map upar hai, isliye chunne ke waqt map tak scroll karo
    document.querySelector('.map-area')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="app">
      <Header isMock={isMock} />
      <StatsBar {...stats} />

      <div className="layout">
        <main className="map-area">
          {loading && <div className="map-overlay">Loading map...</div>}
          {!loading && !loadError && places.length === 0 && (
            <div className="map-overlay">No places found yet. Upload the first photo!</div>
          )}
          <MapView
            places={filtered}
            onSelect={setSelected}
            flyTarget={flyTarget}
            pickMode={pickMode}
            onPick={handleMapPick}
            location={location}
          />
        </main>

        <aside className="sidebar">
          <SearchBar
            query={query}
            onQueryChange={setQuery}
            typeFilter={typeFilter}
            onTypeChange={setTypeFilter}
            results={filtered.slice(0, 6)}
            onResultClick={focusPlace}
          />

          {loadError && (
            <div className="banner error-banner">
              <p>{loadError}</p>
              <button className="btn ghost small" onClick={() => window.location.reload()}>
                Try again
              </button>
            </div>
          )}

          {selected && (
            <PlaceDetail
              key={selected._id}
              place={selected}
              onClose={() => setSelected(null)}
              onUpdated={handleUpdated}
            />
          )}

          <UploadPanel
            location={location}
            onLocationFound={setLocation}
            pickMode={pickMode}
            onTogglePick={togglePick}
            onNewPlace={handleNewPlace}
          />
        </aside>
      </div>
    </div>
  )
}
