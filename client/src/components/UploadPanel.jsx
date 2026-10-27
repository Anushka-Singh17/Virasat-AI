import { useEffect, useState } from 'react'
import exifr from 'exifr'
import { analyzeImage } from '../api'

const SOURCE_BADGE = {
  database: { text: 'Hamare archive mein mila', cls: 'badge-db' },
  gemini: { text: 'AI ne pehchana', cls: 'badge-ai' },
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
        <p className="hint">Map par is pin ko kholo aur "Add info" dabao.</p>
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
    setGpsNote('Photo se GPS padh raha hoon...')

    try {
      const gps = await exifr.gps(chosen)
      if (gps?.latitude && gps?.longitude) {
        onLocationFound({ lat: gps.latitude, lng: gps.longitude })
        setGpsNote('Photo se GPS mil gaya ✅')
      } else {
        setGpsNote('Is photo mein GPS nahi hai. Map par click karke location chuno.')
      }
    } catch {
      setGpsNote('GPS padhne mein dikkat aayi. Map par location chuno.')
    }
  }

  async function handleSubmit() {
    if (!file) return
    if (mode === 'place' && !location) {
      setError('Place photo ke liye location chahiye (GPS ya map click)')
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
      setError('AI check nahi kar paya. Backend chal raha hai ya nahi, dekho.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="card upload">
      <h3>Virasat ka photo ya dastavez daalo</h3>

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
          <span>📷 Tap karke photo chuno</span>
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
                  ? 'Location optional hai'
                  : 'Location abhi nahi'}
            </span>
            <button className="btn ghost small" onClick={onTogglePick}>
              {pickMode ? 'Cancel' : 'Map par chuno'}
            </button>
          </div>
        </>
      )}

      <button className="btn primary full" disabled={!file || loading} onClick={handleSubmit}>
        {loading ? 'Ruko...' : 'Pehchaano'}
      </button>

      {loading && <p className="loading">AI padh raha hai...</p>}
      {error && <p className="error">{error}</p>}
      {result && <ResultCard data={result} />}
    </section>
  )
}
