import { useEffect, useMemo, useRef, useState } from 'react'
import Header from './components/Header'
import StatsBar from './components/StatsBar'
import SearchBar from './components/SearchBar'
import MapView from './components/MapView'
import PlaceDetail from './components/PlaceDetail'
import UploadPanel from './components/UploadPanel'
import TrailsPanel from './components/TrailsPanel'
import { TRAILS } from './trails'
import { getPlaces, getStats, isMock } from './api'
import { useLanguage } from './i18n/LanguageContext'
import './App.css'

const MAP_SIZE_KEY = 'heritage-map-size'
const DEFAULT_MAP_SIZE = { width: 60, height: 60 }

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

// Pichli baar ka map size yaad rakhte hain (agar browser allow kare)
function readMapSize() {
  try {
    const saved = JSON.parse(localStorage.getItem(MAP_SIZE_KEY))
    if (saved && Number.isFinite(saved.width) && Number.isFinite(saved.height)) {
      return { width: clamp(saved.width, 30, 85), height: clamp(saved.height, 30, 85) }
    }
  } catch {
    // storage ya JSON kharab ho to default use karo
  }
  return DEFAULT_MAP_SIZE
}

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

  // Trail: chuni hui trail ka id, aur abhi kaun sa stop (null = abhi start nahi hua)
  const [activeTrailId, setActiveTrailId] = useState(null)
  const [stopIndex, setStopIndex] = useState(null)

  // Real mode mein stats backend se aate hain, aur kab update hue ye bhi yaad rakhte hain
  const [serverStats, setServerStats] = useState({ total: 0, verified: 0, unknown: 0 })
  const [statsUpdatedAt, setStatsUpdatedAt] = useState(() => Date.now())

  // Map ka size (desktop: width %, mobile: height vh) aur fullscreen state
  const layoutRef = useRef(null)
  const [mapSize, setMapSize] = useState(readMapSize)
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(MAP_SIZE_KEY, JSON.stringify(mapSize))
    } catch {
      // save nahi hua to koi baat nahi, bas next visit par default hoga
    }
  }, [mapSize])

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

  // Chuni hui trail ke stops, naam se places dhoondh kar (order same rakhte hain)
  const trailStops = useMemo(() => {
    const trail = TRAILS.find((tr) => tr.id === activeTrailId)
    if (!trail) return null
    return trail.stops.map((name) => places.find((p) => p.naam === name)).filter(Boolean)
  }, [activeTrailId, places])

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

  function chooseTrail(id) {
    setActiveTrailId(id)
    setStopIndex(null)
    setSelected(null)
  }

  // Trail ka ek stop: map us par fly kare aur panel khule
  function goToStop(index) {
    const stop = trailStops?.[index]
    if (!stop) return
    setStopIndex(index)
    focusPlace(stop)
  }

  function exitTrail() {
    setActiveTrailId(null)
    setStopIndex(null)
    setFlyTarget({ lat: 22.5, lng: 79, zoom: 5 })
  }

  function handleMapPick(loc) {
    setLocation(loc)
    setPickMode(false)
  }

  // Header ke button se upload panel tak scroll karo
  function openUploadPanel() {
    document.querySelector('.upload')?.scrollIntoView({ behavior: 'smooth' })
  }

  function togglePick() {
    setPickMode((on) => !on)
    // Mobile par map upar hai, isliye chunne ke waqt map tak scroll karo
    document.querySelector('.map-area')?.scrollIntoView({ behavior: 'smooth' })
  }

  // Handle ko khinchne par map ka size badalta hai (mouse ya touch dono)
  function startResize(e) {
    e.preventDefault()
    const isDesktop = window.matchMedia('(min-width: 768px)').matches
    document.body.style.userSelect = 'none'
    document.body.style.cursor = isDesktop ? 'col-resize' : 'row-resize'

    function onMove(ev) {
      const rect = layoutRef.current.getBoundingClientRect()
      if (isDesktop) {
        const percent = ((ev.clientX - rect.left) / rect.width) * 100
        setMapSize((s) => ({ ...s, width: clamp(percent, 30, 85) }))
      } else {
        const percent = ((ev.clientY - rect.top) / window.innerHeight) * 100
        setMapSize((s) => ({ ...s, height: clamp(percent, 30, 85) }))
      }
    }

    function onUp() {
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  return (
    <div className="app">
      <Header isMock={isMock} onAddPlace={openUploadPanel} />
      <StatsBar {...stats} updatedAt={statsUpdatedAt} />

      <div
        className="layout"
        ref={layoutRef}
        style={{ '--map-width': `${mapSize.width}%`, '--map-height': `${mapSize.height}vh` }}
      >
        <main className={`map-area ${fullscreen ? 'fullscreen' : ''}`}>
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
            fullscreen={fullscreen}
            onToggleFullscreen={() => setFullscreen((on) => !on)}
            trailStops={trailStops}
          />
        </main>

        <div
          className="resize-handle"
          role="separator"
          aria-label="Resize map"
          onPointerDown={startResize}
        />

        <aside className="sidebar">
          <SearchBar
            query={query}
            onQueryChange={setQuery}
            typeFilter={typeFilter}
            onTypeChange={setTypeFilter}
            results={filtered.slice(0, 6)}
            onResultClick={focusPlace}
          />

          <TrailsPanel
            trails={TRAILS}
            activeId={activeTrailId}
            stopIndex={stopIndex}
            stopCount={trailStops?.length ?? 0}
            onChoose={chooseTrail}
            onPrev={() => goToStop(stopIndex - 1)}
            onNext={() => goToStop((stopIndex ?? -1) + 1)}
            onExit={exitTrail}
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
