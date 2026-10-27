import { useEffect, useState } from 'react'
import exifr from 'exifr'
import { analyzeImage } from '../api'
import { useLanguage } from '../i18n/LanguageContext'

const SOURCE_BADGE = {
  database: { key: 'sourceDatabase', cls: 'badge-db' },
  gemini: { key: 'sourceGemini', cls: 'badge-ai' },
  unknown: { key: 'sourceUnknown', cls: 'badge-unknown' },
}

function ResultCard({ data }) {
  const { t } = useLanguage()
  const badge = SOURCE_BADGE[data.source] ?? SOURCE_BADGE.unknown
  const p = data.place
  return (
    <div className="result">
      <span className={`source-badge ${badge.cls}`}>{t(badge.key)}</span>
      <h4>{p.naam}</h4>
      {p.geminiInfo && <p>{p.geminiInfo}</p>}
      {p.translation && <p>{p.translation}</p>}
      {data.source === 'unknown' && <p className="hint">{t('openPinHint')}</p>}
    </div>
  )
}

export default function UploadPanel({ location, onLocationFound, pickMode, onTogglePick, onNewPlace }) {
  const { t } = useLanguage()
  const [mode, setMode] = useState('place')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [gpsNote, setGpsNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  // Preview ke liye object URL banaate hain aur purana saaf karte hain
  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  async function handleFile(e) {
    const chosen = e.target.files?.[0]
    if (!chosen) return
    setFile(chosen)
    setResult(null)
    setError('')
    setGpsNote(t('readingGps'))

    try {
      const gps = await exifr.gps(chosen)
      if (gps?.latitude && gps?.longitude) {
        onLocationFound({ lat: gps.latitude, lng: gps.longitude })
        setGpsNote(t('gpsFound'))
      } else {
        setGpsNote(t('noGps'))
      }
    } catch {
      setGpsNote(t('gpsError'))
    }
  }

  async function handleSubmit() {
    if (!file) return
    if (mode === 'place' && !location) {
      setError(t('needLocation'))
      return
    }

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
      setResult(data)
      onNewPlace(data.place)
    } catch {
      setError(t('aiError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="card upload">
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
        <input type="file" accept="image/*" onChange={handleFile} />
        {preview ? (
          <img src={preview} alt={t('previewAlt')} />
        ) : (
          <span>📷 {t('choosePhoto')}</span>
        )}
      </label>

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

      <button className="btn primary full" disabled={!file || loading} onClick={handleSubmit}>
        {loading ? t('pleaseWait') : t('identify')}
      </button>

      {loading && <p className="loading">{t('aiReading')}</p>}
      {error && <p className="error">{error}</p>}
      {result && <ResultCard data={result} />}
    </section>
  )
}
