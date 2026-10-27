import { useState } from 'react'
import { updatePlace } from '../api'
import { photoSrc } from '../utils'

const TYPE_LABEL = { baoli: 'Baoli', kila: 'Fort', mandir: 'Temple', other: 'Other' }


function Section({ title, text }) {
  return (
    <div className="section">
      <h4>{title}</h4>
      <p>{text}</p>
    </div>
  )
}

export default function PlaceDetail({ place, onClose, onUpdated }) {
  const [editing, setEditing] = useState(false)
  const [naam, setNaam] = useState('')
  const [story, setStory] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const src = photoSrc(place.photo)
  const isUnknown = place.status === 'anjaan'
  const hasInfo = place.geminiInfo || place.translation || place.userKahani

  async function handleSubmit(e) {
    e.preventDefault()
    if (!naam.trim()) {
      setError('Place name is required')
      return
    }
    setSaving(true)
    setError('')
    try {
      const updated = await updatePlace(place._id, { naam: naam.trim(), userKahani: story.trim() })
      onUpdated(updated)
      setEditing(false)
    } catch {
      setError('Could not save. Please check the backend.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <article className="card detail">
      <button className="icon-btn close" onClick={onClose} aria-label="Close">
        ×
      </button>

      {src ? (
        <img className="detail-photo" src={src} alt={place.naam} />
      ) : (
        <div className="photo-placeholder">🏛️</div>
      )}

      <div className="detail-body">
        <span className={`status-badge ${place.status}`}>
          {isUnknown ? 'Unknown – help needed' : 'Verified'}
        </span>
        <h2>{place.naam}</h2>
        <p className="meta">
          {TYPE_LABEL[place.type] ?? place.type} · {place.state || 'State unknown'}
        </p>

        {place.geminiInfo && <Section title="AI information" text={place.geminiInfo} />}
        {place.translation && <Section title="Translation" text={place.translation} />}
        {place.userKahani && <Section title="Community story" text={place.userKahani} />}
        {!hasInfo && <p className="muted">No information about this place yet.</p>}

        {isUnknown && !editing && (
          <button className="btn primary" onClick={() => setEditing(true)}>
            Add info
          </button>
        )}

        {isUnknown && editing && (
          <form className="add-info" onSubmit={handleSubmit}>
            <input
              className="input"
              placeholder="Place name"
              value={naam}
              onChange={(e) => setNaam(e.target.value)}
            />
            <textarea
              className="input"
              rows={4}
              placeholder="Its story, history, or anything you know..."
              value={story}
              onChange={(e) => setStory(e.target.value)}
            />
            <div className="row">
              <button className="btn primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button type="button" className="btn ghost" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
            {error && <p className="error">{error}</p>}
          </form>
        )}
      </div>
    </article>
  )
}
