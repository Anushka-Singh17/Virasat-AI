import { useEffect, useRef, useState } from 'react'
import exifr from 'exifr'
import { analyzeImage } from '../api'
import { useLanguage } from '../i18n/LanguageContext'
import { SAMPLES, cachedResult } from '../samples'

// Sample click par asli AI ko itna hi time dete hain, phir saved result dikhate hain
const SAMPLE_TIMEOUT_MS = 8000

const SOURCE_BADGE = {
  database: { key: 'sourceDatabase', cls: 'badge-db' },
  gemini: { key: 'sourceGemini', cls: 'badge-ai' },
  unknown: { key: 'sourceUnknown', cls: 'badge-unknown' },
}

const hasCoords = (p) => Number.isFinite(p?.lat) && Number.isFinite(p?.lng)

function ResultCard({ data }) {
  const { t } = useLanguage()
  const badge = SOURCE_BADGE[data.source] ?? SOURCE_BADGE.unknown
  const p = data.place
  return (
    <div className="result">
      <span className={`source-badge ${badge.cls}`}>{t(badge.key)}</span>
      {data.aiLocated && <span className="source-badge badge-ai">{t('aiLocated')}</span>}
      <h4>{p.naam}</h4>
      {p.geminiInfo && <p>{p.geminiInfo}</p>}
      {p.translation && <p>{p.translation}</p>}
      {data.cached && <p className="hint cached-note">{t('cachedDemo')}</p>}
      {data.source === 'unknown' && <p className="hint">{t('openPinHint')}</p>}
    </div>
  )
}

export default function UploadPanel({
  location,
  onLocationFound,
  pickMode,
  onTogglePick,
  onNewPlace,
  mobileOpen,
  onMobileClose,
}) {
  const { t } = useLanguage()
  const [mode, setMode] = useState('place')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [gpsNote, setGpsNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  // Request chalte waqt dobara submit na ho (button disabled hone se pehle ka gap bhi band)
  const submittingRef = useRef(false)
  const samplesRef = useRef(null)

  // Do alag file inputs: camera (seedha back camera) aur gallery
  const cameraRef = useRef(null)
  const galleryRef = useRef(null)
  // Mobile (<= 768px, CSS ke breakpoint jaisa): dashed box nahi, sirf do bade buttons.
  // Desktop: sirf dashed box (click ya drag & drop), koi alag button nahi.
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 768px)').matches)
  const [dragging, setDragging] = useState(false) // desktop: photo box ke upar khinch kar laayi gayi
  const [changing, setChanging] = useState(false) // mobile: "Change photo" dabaya, buttons dobara dikhao
  // Camera se photo aayi aur usme GPS nahi tha: "Are you at this place right now?" poochna hai
  const [cameraNoGps, setCameraNoGps] = useState(false)

  // Gemini ne jagah nahi batayi aur user ki location bhi nahi hai: user se poochna hai
  const needsLocation = result !== null && !hasCoords(result.place) && !location

  // Preview ke liye object URL banaate hain aur purana saaf karte hain
  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  // Window ki chaudai badle (jaise phone ghumaya) to mobile/desktop dikhawat apne aap badle
  useEffect(() => {
    const query = window.matchMedia('(max-width: 768px)')
    const onChange = (e) => setIsMobile(e.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  // File input se photo aayi. source: "camera" (Take photo) ya "gallery"
  function handleFile(e, source) {
    const chosen = e.target.files?.[0]
    e.target.value = '' // wahi photo dobara chunne par bhi change event aaye
    if (chosen) processFile(chosen, source)
  }

  // Desktop: dashed box par photo chhodi gayi (drag & drop)
  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files?.[0]
    if (!dropped) return
    if (!dropped.type.startsWith('image/')) {
      setError(t('notImage'))
      return
    }
    processFile(dropped, 'gallery')
  }

  // Photo mil gayi (kisi bhi tareeke se): preview, GPS padhna, purana result saaf
  async function processFile(chosen, source) {
    setFile(chosen)
    setResult(null)
    setError('')
    setCameraNoGps(false)
    setChanging(false)
    setGpsNote(t('readingGps'))

    try {
      const gps = await exifr.gps(chosen)
      if (gps?.latitude && gps?.longitude) {
        onLocationFound({ lat: gps.latitude, lng: gps.longitude })
        setGpsNote(t('gpsFound'))
      } else {
        setGpsNote(t('noGps'))
        if (source === 'camera') setCameraNoGps(true)
      }
    } catch {
      setGpsNote(t('gpsError'))
      if (source === 'camera') setCameraNoGps(true)
    }
  }

  // Location optional hai: bina location ke bhi Identify chalta hai
  async function handleSubmit() {
    if (!file || submittingRef.current) return
    submittingRef.current = true

    setLoading(true)
    setError('')
    setResult(null)
    try {
      const data = await analyzeImage({
        file,
        mode,
        lat: location?.lat,
        lng: location?.lng,
      })
      // User ki location nahi thi, aur Gemini ne di: use "AI located" badge ke saath dikhao
      const aiLocated = !location && hasCoords(data.place)
      setResult({ ...data, aiLocated })
      // Pin tabhi banega jab jagah pata ho
      if (hasCoords(data.place)) onNewPlace(data.place)
    } catch {
      setError('busy') // dikhate waqt aiBusy message + "Try a sample" link banta hai
    } finally {
      submittingRef.current = false
      setLoading(false)
    }
  }

  // "Try a sample": photo load karo, asli AI try karo (8 s), na chale to saved result dikhao
  async function handleSample(sample) {
    if (submittingRef.current) return
    submittingRef.current = true

    setMode('place')
    setLoading(true)
    setError('')
    setResult(null)
    setCameraNoGps(false)
    setChanging(false)
    const where = { lat: sample.cached.lat, lng: sample.cached.lng }
    try {
      // Public folder ki photo ko File bana kar wahi flow chalate hain jo asli upload ka hai
      let sampleFile = null
      try {
        const blob = await (await fetch(sample.image)).blob()
        sampleFile = new File([blob], `${sample.id}.jpg`, { type: blob.type || 'image/jpeg' })
        setFile(sampleFile)
      } catch {
        // photo na mile to bhi cached result dikha denge
      }
      onLocationFound(where)
      setGpsNote(t('confirmedNote'))

      let data
      try {
        if (!sampleFile) throw new Error('no file')
        data = await analyzeImage({ file: sampleFile, mode: 'place', ...where, timeout: SAMPLE_TIMEOUT_MS })
        if (!data?.place?.naam || data.source === 'unknown') throw new Error('no useful answer')
        if (hasCoords(data.place)) onNewPlace(data.place)
      } catch {
        data = cachedResult(sample) // pin nahi banate: ye sirf demo hai
      }
      setResult(data)
    } finally {
      submittingRef.current = false
      setLoading(false)
    }
  }

  function scrollToSamples() {
    samplesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setError(t('locationDenied'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Backend ise "user" location maanta hai (locationSource: "user")
        onLocationFound({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGpsNote(t('confirmedNote'))
      },
      () => setError(t('locationDenied')),
    )
  }

  return (
    <section className={`card upload ${mobileOpen ? 'open' : ''}`}>
      {/* Sirf mobile par dikhta hai: full-screen panel band karne ke liye */}
      <button type="button" className="icon-btn upload-close" onClick={onMobileClose} aria-label={t('close')}>
        ×
      </button>
      <h3>{t('uploadTitle')}</h3>

      <div className="tabs" role="tablist">
        <button
          className={`tab ${mode === 'place' ? 'active' : ''}`}
          onClick={() => setMode('place')}
        >
          {t('placePhoto')}
        </button>
        <button
          className={`tab ${mode === 'document' ? 'active' : ''}`}
          onClick={() => setMode('document')}
        >
          {t('oldDocument')}
        </button>
      </div>

      {isMobile ? (
        <>
          {/* Mobile: dashed box nahi. Photo aane ke baad preview + "Change photo"; pehle ya change par do bade buttons */}
          {preview && <img className="photo-preview" src={preview} alt={t('previewAlt')} />}

          {preview && !changing ? (
            <button type="button" className="link-btn" onClick={() => setChanging(true)}>
              {t('changePhoto')}
            </button>
          ) : (
            <div className="photo-buttons big">
              <button type="button" className="btn ghost" onClick={() => cameraRef.current?.click()}>
                {t('takePhoto')}
              </button>
              <button type="button" className="btn ghost" onClick={() => galleryRef.current?.click()}>
                {t('chooseGallery')}
              </button>
            </div>
          )}

          {/* capture="environment": seedha back camera khulta hai */}
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(e) => handleFile(e, 'camera')}
          />
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => handleFile(e, 'gallery')}
          />
        </>
      ) : (
        <>
          {/* Desktop: sirf dashed box. Click se picker, ya photo yahan khinch kar chhodo. */}
          <label
            className={`dropzone ${dragging ? 'dragging' : ''}`}
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={(e) => {
              // Box ke andar ke bachchon (jaise preview image) par jaane se highlight na hate
              if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false)
            }}
            onDrop={handleDrop}
          >
            <input
              ref={galleryRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFile(e, 'gallery')}
            />
            {preview ? (
              <img src={preview} alt={t('previewAlt')} />
            ) : (
              <span>{t('dropHint')}</span>
            )}
          </label>

          {preview && (
            <button type="button" className="link-btn" onClick={() => galleryRef.current?.click()}>
              {t('changePhoto')}
            </button>
          )}
        </>
      )}

      {file && (
        <>
          <p className="hint">{gpsNote}</p>
          <div className="row location-row">
            <span>
              📍{' '}
              {location
                ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
                : mode === 'document'
                  ? t('locationOptional')
                  : t('noLocation')}
            </span>
            <button className="btn ghost small" onClick={onTogglePick}>
              {pickMode ? t('cancel') : t('pickOnMap')}
            </button>
          </div>
        </>
      )}

      {/* Camera se photo aayi par GPS nahi mila: kya user abhi isi jagah par hai? */}
      {cameraNoGps && !location && (
        <div className="location-ask">
          <p>{t('hereNowQ')}</p>
          <div className="row">
            <button type="button" className="btn ghost small" onClick={handleUseCurrentLocation}>
              {t('useCurrentLocation')}
            </button>
          </div>
        </div>
      )}

      <button className="btn primary full" disabled={!file || loading} onClick={handleSubmit}>
        {loading ? t('pleaseWait') : t('identify')}
      </button>

      {loading && <p className="loading">{t('aiReading')}</p>}
      {error === 'busy' ? (
        <p className="error">
          {t('aiBusy')}{' '}
          <button type="button" className="link-btn inline" onClick={scrollToSamples}>
            {t('aiBusyLink')}
          </button>
        </p>
      ) : (
        error && <p className="error">{error}</p>
      )}
      {result && <ResultCard data={result} />}

      {needsLocation && (
        <div className="location-ask">
          <p>{t('askLocation')}</p>
          <div className="row">
            <button className="btn ghost small" onClick={handleUseCurrentLocation}>
              {t('useCurrentLocation')}
            </button>
            <button className="btn ghost small" onClick={onTogglePick}>
              {t('pickOnMap')}
            </button>
          </div>
        </div>
      )}

      {/* Demo safety net: 3 free photos, AI na chale tab bhi result dikhta hai */}
      <div className="samples" ref={samplesRef}>
        <h4>{t('trySample')}</h4>
        <p className="hint">{t('sampleHint')}</p>
        <div className="sample-grid">
          {SAMPLES.map((s) => (
            <button
              key={s.id}
              type="button"
              className="sample-btn"
              disabled={loading}
              onClick={() => handleSample(s)}
            >
              <img src={s.image} alt={s.label} loading="lazy" />
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
