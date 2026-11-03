import { useEffect, useRef, useState } from 'react'
import exifr from 'exifr'
import { analyzeImage } from '../api'
import { useLanguage } from '../i18n/LanguageContext'

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

  // Do alag file inputs: camera (seedha back camera) aur gallery. Dono button se trigger hote hain.
  const cameraRef = useRef(null)
  const galleryRef = useRef(null)
  // "Take photo" sirf touch device (phone/tablet) par. Desktop par camera ka matlab nahi, wahan sirf "Choose photo".
  const [canTakePhoto] = useState(() => window.matchMedia('(pointer: coarse)').matches)
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

  // source: "camera" (Take photo) ya "gallery" (Choose photo)
  async function handleFile(e, source) {
    const chosen = e.target.files?.[0]
    e.target.value = '' // wahi photo dobara chunne par bhi change event aaye
    if (!chosen) return
    setFile(chosen)
    setResult(null)
    setError('')
    setCameraNoGps(false)
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
      setError(t('aiError'))
    } finally {
      submittingRef.current = false
      setLoading(false)
    }
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

      <label className="dropzone">
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFile(e, 'gallery')}
        />
        {preview ? (
          <img src={preview} alt={t('previewAlt')} />
        ) : (
          <span>📷 {t('choosePhoto')}</span>
        )}
      </label>

      {/* Camera input: capture="environment" se seedha back camera khulta hai (sirf touch devices par) */}
      {canTakePhoto && (
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => handleFile(e, 'camera')}
        />
      )}

      <div className="row photo-buttons">
        {canTakePhoto && (
          <button type="button" className="btn ghost" onClick={() => cameraRef.current?.click()}>
            {t('takePhoto')}
          </button>
        )}
        <button type="button" className="btn ghost" onClick={() => galleryRef.current?.click()}>
          {canTakePhoto ? t('chooseGallery') : t('choosePhotoBtn')}
        </button>
      </div>

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
      {error && <p className="error">{error}</p>}
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
    </section>
  )
}
