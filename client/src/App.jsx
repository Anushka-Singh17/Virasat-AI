import { useEffect, useMemo, useState } from 'react'
import Header from './components/Header'
import StatsBar from './components/StatsBar'
import SearchBar from './components/SearchBar'
import MapView from './components/MapView'
import PlaceDetail from './components/PlaceDetail'
import UploadPanel from './components/UploadPanel'
import { getPlaces, getStats, isMock } from './api'
import { useLanguage } from './i18n/LanguageContext'
import './App.css'

export default function App() {
  const { t } = useLanguage()
  const [places, setPlaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [flyTarget, setFlyTarget] = useState(null)
  const [pickMode, setPickMode] = useState(false)
  const [location, setLocation] = useState(null)

  // Real mode mein stats backend se aate hain, aur kab update hue ye bhi yaad rakhte hain
  const [serverStats, setServerStats] = useState({ total: 0, verified: 0, unknown: 0 })
  const [statsUpdatedAt, setStatsUpdatedAt] = useState(() => Date.now())

  // App start hote hi places laao
  useEffect(() => {
    let ignore = false
    getPlaces()
      .then((data) => {
        if (!ignore) setPlaces(data)
      })
      .catch(() => {
        if (!ignore) setLoadError(true)
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })
    return () => {
      ignore = true
    }
  }, [])

  // Real mode: start hote hi stats backend se lo
  useEffect(() => {
    if (isMock) return
    let ignore = false
    getStats()
      .then((s) => {
        if (!ignore) {
          setServerStats(s)
          setStatsUpdatedAt(Date.now())
        }
      })
      .catch(() => {})
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

  // Mock mode mein stats places se ginte hain
  const localStats = {
    total: places.length,
    verified: places.filter((p) => p.status === 'verified').length,
    unknown: places.filter((p) => p.status === 'anjaan').length,
  }
  const stats = isMock ? localStats : serverStats

  function refreshStats() {
    if (isMock) {
      setStatsUpdatedAt(Date.now())
      return
    }
    getStats()
      .then((s) => {
        setServerStats(s)
        setStatsUpdatedAt(Date.now())
      })
      .catch(() => {})
  }

  function focusPlace(place) {
    setSelected(place)
    setFlyTarget({ lat: place.lat, lng: place.lng, zoom: 13 })
  }

  function handleUpdated(updated) {
    setPlaces((prev) => prev.map((p) => (p._id === updated._id ? updated : p)))
    setSelected(updated)
    refreshStats()
  }

  function handleNewPlace(place) {
    setPlaces((prev) =>
      prev.some((p) => p._id === place._id)
        ? prev.map((p) => (p._id === place._id ? place : p))
        : [...prev, place],
    )
    focusPlace(place)
    refreshStats()
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
      <StatsBar {...stats} updatedAt={statsUpdatedAt} />

      <div className="layout">
        <main className="map-area">
          {loading && <div className="map-overlay">{t('loadingMap')}</div>}
          {!loading && !loadError && places.length === 0 && (
            <div className="map-overlay">{t('noPlacesYet')}</div>
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
              <p>{t('backendDown')}</p>
              <button className="btn ghost small" onClick={() => window.location.reload()}>
                {t('tryAgain')}
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
