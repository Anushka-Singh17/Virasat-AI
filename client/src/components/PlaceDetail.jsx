import { useEffect, useState } from 'react'
import { updatePlace } from '../api'
import { photoSrc, readImageAsDataUrl } from '../utils'
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
  const { t, lang } = useLanguage()
  const [editing, setEditing] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window
  const [naam, setNaam] = useState('')
  const [builtInfo, setBuiltInfo] = useState('')
  const [story, setStory] = useState('')
  const [photo, setPhoto] = useState('')
  const [contributor, setContributor] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const src = photoSrc(place.photo)
  const isUnknown = place.status === 'anjaan'
  const hasInfo = place.geminiInfo || place.translation || place.userKahani

  // Panel band ho ya place badle to bolna band karo
  useEffect(() => {
    return () => window.speechSynthesis?.cancel()
  }, [])

  // Naam + kahani bolta hai. Hindi chuni ho to hi-IN, warna English
  function handleListen() {
    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }
    const text = [place.naam, place.geminiInfo, place.translation, place.userKahani]
      .filter(Boolean)
      .join('. ')
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-US'
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(utterance)
    setSpeaking(true)
  }

  async function handlePhoto(e) {
    const chosen = e.target.files?.[0]
    if (!chosen) return
    try {
      setPhoto(await readImageAsDataUrl(chosen))
      setError('')
    } catch {
      setError(t('photoError'))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!naam.trim()) {
      setError(t('nameRequired'))
      return
    }
    setSaving(true)
    setError('')
    const body = {
      naam: naam.trim(),
      userKahani: story.trim(),
      builtInfo: builtInfo.trim(),
      contributorName: contributor.trim(),
    }
    if (photo) body.photo = photo
    try {
      const updated = await updatePlace(place._id, body)
      // Contributor ka naam panel mein dikhane ke liye local copy bhi rakhte hain
      onUpdated({ ...updated, contributorName: contributor.trim() })
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
        {place.builtInfo && <Section title={t('builtInfo')} text={place.builtInfo} />}
        {place.userKahani && <Section title={t('communityStory')} text={place.userKahani} />}
        {!hasInfo && <p className="muted">{t('noInfo')}</p>}

        {place.contributorName != null && (
          <p className="contributor">
            {t('storyAddedBy', { name: place.contributorName || t('anonymous') })}
          </p>
        )}

        {speechSupported && (
          <button className="btn ghost listen-btn" onClick={handleListen}>
            {speaking ? t('stopSpeaking') : t('listen')}
          </button>
        )}

        {isUnknown && !editing && (
          <button className="btn primary" onClick={() => setEditing(true)}>
            {t('addInfoBtn')}
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
            <input
              className="input"
              placeholder={t('builtInfoPlaceholder')}
              value={builtInfo}
              onChange={(e) => setBuiltInfo(e.target.value)}
            />
            <textarea
              className="input"
              rows={4}
              placeholder={t('storyPlaceholder')}
              value={story}
              onChange={(e) => setStory(e.target.value)}
            />
            <label className="file-field">
              <span>{t('photoOptional')}</span>
              <input type="file" accept="image/*" onChange={handlePhoto} />
            </label>
            {photo && <img className="form-photo-preview" src={photo} alt="" />}
            <input
              className="input"
              placeholder={t('contributorPlaceholder')}
              value={contributor}
              onChange={(e) => setContributor(e.target.value)}
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
        {error && !editing && <p className="error">{error}</p>}
      </div>
    </article>
  )
}
