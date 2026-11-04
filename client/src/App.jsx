import { useEffect, useMemo, useRef, useState } from 'react'
import Header from './components/Header'
import StatsBar from './components/StatsBar'
import SearchBar from './components/SearchBar'
import MapView from './components/MapView'
import PlaceDetail from './components/PlaceDetail'
import UploadPanel from './components/UploadPanel'
import AddPlaceModal from './components/AddPlaceModal'
import TrailsPanel from './components/TrailsPanel'
import ServerOverlay from './components/ServerOverlay'
import { retryWithBackoff } from './retry'
import { buildTrails } from './trails'
import { getPlaces, getStats, isMock } from './api'
import { useLanguage } from './i18n/LanguageContext'
import './App.css'

// v2: naya default (map 65%, sidebar 35%) sab par lage, purane save kiye hue size se na dabe
const MAP_SIZE_KEY = 'heritage-map-size-v2'
const DEFAULT_MAP_SIZE = { width: 65, height: 60 }

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

// Chhoti (mobile) screen hai ya nahi: CSS ke 768px breakpoint se match karta hai
const isMobileScreen = () => window.matchMedia('(max-width: 768px)').matches

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
  const [slow, setSlow] = useState(false) // places 3 second se zyada le rahe hain
  const [attempt, setAttempt] = useState(0) // Retry button ise badhata hai, to loading effect dobara chalta hai

  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [flyTarget, setFlyTarget] = useState(null)
  const [pickMode, setPickMode] = useState(false)
  const [location, setLocation] = useState(null)

  // Trail: chuni hui trail ka id, aur abhi kaun sa stop (null = abhi start nahi hua)
  const [activeTrailId, setActiveTrailId] = useState(null)
  const [stopIndex, setStopIndex] = useState(null)

  // Header ka "Add a hidden heritage place" popup, aur success par "Thank you!" message
  const [addOpen, setAddOpen] = useState(false)
  const [thanks, setThanks] = useState(false)

  // Mobile par upload panel full-screen khulta hai (floating 📷 button se)
  const [uploadOpen, setUploadOpen] = useState(false)

  // Desktop sidebar ke 3 tabs: explore (search), trails, identify (upload). Mobile par sab ek saath dikhte hain.
  const [sideTab, setSideTab] = useState('explore')
  const pickFromUpload = useRef(false) // map par location upload panel ke liye chuni ja rahi hai

  // Thank you message 3 second baad apne aap gayab
  useEffect(() => {
    if (!thanks) return
    const timer = setTimeout(() => setThanks(false), 3000)
    return () => clearTimeout(timer)
  }, [thanks])

  // Real mode mein stats backend se aate hain, aur kab update hue ye bhi yaad rakhte hain
  // null = abhi aaye nahi (stats bar "—" dikhata hai)
  const [serverStats, setServerStats] = useState(null)
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

  // App start hote hi places laao. Server soya ho (free hosting) to ~60 second tak apne aap retry (2s, 4s, 8s, 16s...).
  // 3 second se zyada lage to "server jaag raha hai" overlay dikhta hai.
  useEffect(() => {
    let cancelled = false
    const slowTimer = setTimeout(() => setSlow(true), 3000)

    retryWithBackoff(getPlaces, { isCancelled: () => cancelled })
      .then((data) => {
        if (!cancelled) setPlaces(data)
      })
      .catch(() => {
        if (!cancelled) setLoadError(true)
      })
      .finally(() => {
        clearTimeout(slowTimer)
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
      clearTimeout(slowTimer)
    }
  }, [attempt])

  // Real mode: stats bhi isi tarah retry ke saath. Na aaye to stats bar mein "—" dikhta rahega (app nahi tootta).
  useEffect(() => {
    if (isMock) return
    let cancelled = false

    retryWithBackoff(getStats, { isCancelled: () => cancelled })
      .then((s) => {
        if (!cancelled) {
          setServerStats(s)
          setStatsUpdatedAt(Date.now())
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [attempt])

  // Overlay ke "Retry" button se: sab dobara shuru
  function retryLoad() {
    setLoadError(false)
    setLoading(true)
    setSlow(true) // user pehle hi intezaar kar chuka hai, isliye seedha "jaag raha hai" message
    setAttempt((n) => n + 1)
  }

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

  // Trails: Featured (curated) + Explore by region (places ke state se apne aap)
  const trails = useMemo(() => buildTrails(places), [places])

  // Chuni hui trail ke stops (order trail mein hi tay hai)
  const trailStops = useMemo(() => {
    const trail = [...trails.featured, ...trails.regions].find((tr) => tr.id === activeTrailId)
    return trail ? trail.stops : null
  }, [trails, activeTrailId])

  // Mock mode mein stats places se ginte hain
  const localStats = {
    total: places.length,
    verified: places.filter((p) => p.status === 'verified' || p.status === 'community').length,
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
    // Mobile par bottom sheet neeche ka hissa dhak leti hai, isliye pin ko upar rakhne ke liye inset
    setFlyTarget({
      lat: place.lat,
      lng: place.lng,
      zoom: 13,
      inset: isMobileScreen() ? window.innerHeight * 0.45 : 0,
    })
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
    setUploadOpen(false) // mobile: upload ke baad full-screen panel band, map par pin dikhe
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
    // Mobile: upload panel ke liye location chuni thi to wo panel wapas khol do
    if (pickFromUpload.current) {
      pickFromUpload.current = false
      setUploadOpen(true)
    }
  }

  // Header ke button se popup form khulta hai
  function openAddPlace() {
    setAddOpen(true)
  }

  // Modal ke andar "Use my current location"
  function getMyLocation() {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
    )
  }

  // Modal se map par location chunne ka mode on karo
  function pickOnMapForPlace() {
    pickFromUpload.current = false
    setPickMode(true)
    document.querySelector('.map-area')?.scrollIntoView({ behavior: 'smooth' })
  }

  // Naya sthal bana: modal band, pin par fly, thank you message
  function handlePlaceCreated(place) {
    handleNewPlace(place)
    setAddOpen(false)
    setThanks(true)
  }

  function togglePick() {
    pickFromUpload.current = true
    setPickMode((on) => !on)
    setUploadOpen(false) // mobile: map dikhne ke liye full-screen panel abhi band
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
      <Header isMock={isMock} onAddPlace={openAddPlace} />
      <StatsBar {...stats} updatedAt={statsUpdatedAt} />

      <AddPlaceModal
        open={addOpen && !pickMode}
        location={location}
        onClose={() => setAddOpen(false)}
        onUseCurrent={getMyLocation}
        onPickOnMap={pickOnMapForPlace}
        places={places}
        onLocationChosen={setLocation}
        onCreated={handlePlaceCreated}
      />

      {thanks && <div className="toast">{t('thankYou')}</div>}

      <div
        className="layout"
        ref={layoutRef}
        style={{ '--map-width': `${mapSize.width}%`, '--map-height': `${mapSize.height}vh` }}
      >
        <main className={`map-area ${fullscreen ? 'fullscreen' : ''}`}>
          {loading && !slow && <div className="map-overlay">{t('loadingMap')}</div>}
          <ServerOverlay waking={loading && slow} error={loadError} onRetry={retryLoad} />
          {!loading && !loadError && places.length === 0 && (
            <div className="map-overlay">{t('noPlacesYet')}</div>
          )}
          <MapView
            places={filtered}
            onSelect={(place) => (isMobileScreen() ? focusPlace(place) : setSelected(place))}
            sheetOpen={Boolean(selected) || uploadOpen}
            flyTarget={flyTarget}
            pickMode={pickMode}
            onPick={handleMapPick}
            location={location}
            fullscreen={fullscreen}
            onLocationDrag={setLocation}
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

        <aside className="sidebar" data-tab={sideTab}>
          <div className="side-tabs" role="tablist">
            {[
              ['explore', 'tabExplore'],
              ['trails', 'tabTrails'],
              ['identify', 'tabIdentify'],
            ].map(([id, labelKey]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={sideTab === id}
                className={`side-tab ${sideTab === id ? 'active' : ''}`}
                onClick={() => setSideTab(id)}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>

          {/* Mobile par ye teeno map ke upar ek compact stack mein aate hain */}
          <div className="top-stack">
            <SearchBar
              query={query}
              onQueryChange={setQuery}
              typeFilter={typeFilter}
              onTypeChange={setTypeFilter}
              results={filtered.slice(0, 6)}
              onResultClick={focusPlace}
            />

            <TrailsPanel
              featured={trails.featured}
              regions={trails.regions}
              activeId={activeTrailId}
              stopIndex={stopIndex}
              stopCount={trailStops?.length ?? 0}
              onChoose={chooseTrail}
              onPrev={() => goToStop(stopIndex - 1)}
              onNext={() => goToStop((stopIndex ?? -1) + 1)}
              onExit={exitTrail}
            />

          </div>

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
            mobileOpen={uploadOpen}
            onMobileClose={() => setUploadOpen(false)}
          />
        </aside>
      </div>

      {/* Mobile ke floating buttons (desktop par CSS se chhupe rehte hain) */}
      <button className="fab fab-upload" onClick={() => setUploadOpen(true)} aria-label={t('uploadTitle')}>
        📷
      </button>
      <button className="fab fab-add" onClick={openAddPlace} aria-label={t('addPlaceTitle')}>
        +
      </button>
    </div>
  )
}
