import { useEffect, useState } from 'react'
import exifr from 'exifr'
import { analyzeImage } from '../api'

const SOURCE_BADGE = {
  database: { text: 'Found in our archive', cls: 'badge-db' },
  gemini: { text: 'Identified by AI', cls: 'badge-ai' },
  unknown: { text: 'Unknown – help us!', cls: 'badge-unknown' },
}

function ResultCard({ data }) {
  const badge = SOURCE_BADGE[data.source] ?? SOURCE_BADGE.unknown
  const p = data.place
  return (
    <div className="result">
      <span className={`source-badge ${badge.cls}`}>{badge.text}</span>
      <h4>{p.naam}</h4>
      {p.geminiInfo && <p>{p.geminiInfo}</p>}
      {p.translation && <p>{p.translation}</p>}
      {data.source === 'unknown' && (
        <p className="hint">Open this pin on the map and click "Add info".</p>
      )}
    </div>
  )
}

export default function UploadPanel({ location, onLocationFound, pickMode, onTogglePick, onNewPlace }) {
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
    setGpsNote('Reading GPS from photo...')

    try {
      const gps = await exifr.gps(chosen)
      if (gps?.latitude && gps?.longitude) {
        onLocationFound({ lat: gps.latitude, lng: gps.longitude })
        setGpsNote('GPS found in photo ✅')
      } else {
        setGpsNote('No GPS in this photo. Click on the map to choose a location.')
      }
    } catch {
      setGpsNote('Could not read GPS. Choose a location on the map.')
    }
  }

  async function handleSubmit() {
    if (!file) return
    if (mode === 'place' && !location) {
      setError('A location is needed for place photos (GPS or map click)')
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
      setError('AI could not check this. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="card upload">
      <h3>Upload a heritage photo or document</h3>

      <div className="tabs" role="tablist">
        <button
          className={`tab ${mode === 'place' ? 'active' : ''}`}
          onClick={() => setMode('place')}
        >
          Place photo
        </button>
        <button
          className={`tab ${mode === 'document' ? 'active' : ''}`}
          onClick={() => setMode('document')}
        >
          Old document
        </button>
      </div>

      <label className="dropzone">
        <input type="file" accept="image/*" onChange={handleFile} />
        {preview ? (
          <img src={preview} alt="Preview" />
        ) : (
          <span>📷 Tap to choose a photo</span>
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
                  ? 'Location is optional'
                  : 'No location yet'}
            </span>
            <button className="btn ghost small" onClick={onTogglePick}>
              {pickMode ? 'Cancel' : 'Pick on map'}
            </button>
          </div>
        </>
      )}

      <button className="btn primary full" disabled={!file || loading} onClick={handleSubmit}>
        {loading ? 'Please wait...' : 'Identify'}
      </button>

      {loading && <p className="loading">AI is reading...</p>}
      {error && <p className="error">{error}</p>}
      {result && <ResultCard data={result} />}
    </section>
  )
}
