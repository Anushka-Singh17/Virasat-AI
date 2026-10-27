import { useState } from 'react'
import { updatePlace } from '../api'
import { photoSrc } from '../utils'
import { useLanguage } from '../i18n/LanguageContext'

const TYPE_KEY = { baoli: 'typeBaoli', kila: 'typeFort', mandir: 'typeTemple', other: 'typeOther' }

function Section({ title, text }) {
  return (
    <div className="section">
      <h4>{title}</h4>
      <p>{text}</p>
    </div>
  )
}

export default function PlaceDetail({ place, onClose, onUpdated }) {
  const { t } = useLanguage()
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
      setError(t('nameRequired'))
      return
    }
    setSaving(true)
    setError('')
    try {
      const updated = await updatePlace(place._id, { naam: naam.trim(), userKahani: story.trim() })
      onUpdated(updated)
      setEditing(false)
    } catch {
      setError(t('saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <article className="card detail">
      <button className="icon-btn close" onClick={onClose} aria-label={t('close')}>
        ×
      </button>

      {src ? (
        <img className="detail-photo" src={src} alt={place.naam} />
      ) : (
        <div className="photo-placeholder">🏛️</div>
      )}

      <div className="detail-body">
        <span className={`status-badge ${place.status}`}>
          {isUnknown ? t('unknownStatus') : t('verified')}
        </span>
        <h2>{place.naam}</h2>
        <p className="meta">
          {TYPE_KEY[place.type] ? t(TYPE_KEY[place.type]) : place.type} · {place.state || t('stateUnknown')}
        </p>

        {place.geminiInfo && <Section title={t('aiInfo')} text={place.geminiInfo} />}
        {place.translation && <Section title={t('translation')} text={place.translation} />}
        {place.userKahani && <Section title={t('communityStory')} text={place.userKahani} />}
        {!hasInfo && <p className="muted">{t('noInfo')}</p>}

        {isUnknown && !editing && (
          <button className="btn primary" onClick={() => setEditing(true)}>
            {t('addInfo')}
          </button>
        )}

        {isUnknown && editing && (
          <form className="add-info" onSubmit={handleSubmit}>
            <input
              className="input"
              placeholder={t('placeNamePlaceholder')}
              value={naam}
              onChange={(e) => setNaam(e.target.value)}
            />
            <textarea
              className="input"
              rows={4}
              placeholder={t('storyPlaceholder')}
              value={story}
              onChange={(e) => setStory(e.target.value)}
            />
            <div className="row">
              <button className="btn primary" disabled={saving}>
                {saving ? t('saving') : t('save')}
              </button>
              <button type="button" className="btn ghost" onClick={() => setEditing(false)}>
                {t('cancel')}
              </button>
            </div>
            {error && <p className="error">{error}</p>}
          </form>
        )}
      </div>
    </article>
  )
}
