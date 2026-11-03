import { useMemo, useState } from 'react'
import { createPlace, searchPlaces, updatePlace } from '../api'
import { readImageAsDataUrl } from '../utils'
import { useLanguage } from '../i18n/LanguageContext'
import MiniMap from './MiniMap'

const EMPTY_FORM = {
  naam: '',
  state: '',
  type: 'other',
  history: '',
  builtBy: '',
  era: '',
  sourcesText: '',
  contributor: '',
  photo: '',
  approx: false,
}

// Do points ke beech door (meters mein)
function metersBetween(a, b) {
  const R = 6371000
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Poori query se kuch na mile to chhoti queries: pehle 2 hisse (comma se pehle wale), phir sirf pehla shabd
function shorterQueries(q) {
  const parts = q.split(',').map((s) => s.trim()).filter(Boolean)
  const candidates = [parts.slice(0, 2).join(', '), (parts[0] || '').split(/\s+/)[0]]
  const list = []
  for (const c of candidates) {
    const same = (x) => x.toLowerCase() === c.toLowerCase()
    if (c && !same(q) && !list.some(same)) list.push(c)
  }
  return list.slice(0, 2)
}

// Header se khulne wala popup form. Band (hidden) hone par bhi data rehta hai.
// Do mode: "new" (nayi jagah) aur "update" (kisi peele pin ki jaankari dena).
export default function AddPlaceModal({
  open,
  places,
  location,
  onClose,
  onUseCurrent,
  onPickOnMap,
  onLocationChosen,
  onCreated,
}) {
  const { t } = useLanguage()
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [mode, setMode] = useState('new')
  const [target, setTarget] = useState(null)
  const [confirmed, setConfirmed] = useState(false)
  const [pendingPin, setPendingPin] = useState(null)
  const [dismissedId, setDismissedId] = useState(null)
  const [miniFly, setMiniFly] = useState(null)
  const [picked, setPicked] = useState(false) // search ka koi result chuna gaya (help text ke liye)
  const [searchMarker, setSearchMarker] = useState(null) // Nominatim result ka marker
  const [highlightId, setHighlightId] = useState(null) // humare place ka highlight
  const [pickedPoint, setPickedPoint] = useState(null) // chune hue search result ki jagah
  const [localResults, setLocalResults] = useState([]) // "On Virasat AI" results
  const [noMatches, setNoMatches] = useState(false)
  const [didYouMean, setDidYouMean] = useState(false) // results chhoti query se mile

  // Location search (Nominatim) ka state
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  // Nayi location ke 200m ke andar pehle se koi sthal hai?
  const nearby = useMemo(() => {
    if (mode !== 'new' || !location) return null
    return (
      places.find(
        (p) => p._id !== dismissedId && metersBetween(location, { lat: p.lat, lng: p.lng }) <= 200,
      ) ?? null
    )
  }, [mode, location, places, dismissedId])

  // Chune hue search result ke aas-paas (1.5 km) koi saved pin (peela ya hara) hai?
  const hasSavedNearby = useMemo(() => {
    if (!pickedPoint) return false
    return places.some((p) => metersBetween(pickedPoint, { lat: p.lat, lng: p.lng }) <= 1500)
  }, [pickedPoint, places])

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  // Location badalne par purani confirmation hat jaati hai
  function moveLocation(loc) {
    setConfirmed(false)
    setDismissedId(null)
    onLocationChosen(loc)
  }

  function clearSearchLists() {
    setResults([])
    setLocalResults([])
  }

  // "Places in India" ka result chuna: mini map zoom 15 par fly kare, aur alag rang ka marker lage
  function chooseResult(result) {
    setPicked(true)
    setPickedPoint({ lat: result.lat, lng: result.lng })
    setSearchMarker({ lat: result.lat, lng: result.lng })
    setHighlightId(null)
    setMiniFly({ lat: result.lat, lng: result.lng, zoom: 15 })
    clearSearchLists()
  }

  // "On Virasat AI" ka result chuna: wahan zoom ho aur uska pin highlight ho
  function chooseLocal(place) {
    setPicked(true)
    setPickedPoint({ lat: place.lat, lng: place.lng })
    setSearchMarker(null)
    setHighlightId(place._id)
    setMiniFly({ lat: place.lat, lng: place.lng, zoom: 15 })
    clearSearchLists()
  }

  // Search sirf button ya Enter par chalta hai. Humare places (partial match) aur Nominatim, dono.
  // Total ek hi result ho to apne aap chun leta hai.
  async function handleSearch() {
    const q = query.trim()
    if (!q) return
    setSearching(true)
    setSearchError('')
    setPicked(false)
    setPickedPoint(null)
    setNoMatches(false)
    setDidYouMean(false)
    setSearchMarker(null)
    setHighlightId(null)

    const lower = q.toLowerCase()
    const local = places
      .filter((p) => p.naam?.toLowerCase().includes(lower) || p.state?.toLowerCase().includes(lower))
      .slice(0, 5)

    // Humare results turant dikhao, Nominatim dheere aa sakta hai
    setLocalResults(local)

    let remote = []
    let failed = false
    let usedRetry = false
    try {
      remote = await searchPlaces(q)
      // Kuch nahi mila: chhoti query se retry (max 2), har retry se pehle 1 second ruko (Nominatim ka rule)
      if (remote.length === 0 && local.length === 0) {
        for (const shorter of shorterQueries(q)) {
          await wait(1000)
          remote = await searchPlaces(shorter)
          if (remote.length > 0) {
            usedRetry = true
            break
          }
        }
      }
    } catch {
      failed = true
      setSearchError(t('searchFailed'))
    }

    setDidYouMean(usedRetry)
    setLocalResults(local)
    setResults(remote)
    setSearching(false)

    const total = local.length + remote.length
    const nothingFound = total === 0 && !failed
    setNoMatches(nothingFound)

    // Kuch nahi mila: purana laal marker aur purani lat/lng hata do
    if (nothingFound && mode === 'new') {
      onLocationChosen(null)
      setConfirmed(false)
    }

    // Retry se mile results mein "Did you mean" dikhana hai, isliye unhe apne aap select nahi karte
    if (total === 1 && !usedRetry) {
      if (local.length === 1) chooseLocal(local[0])
      else chooseResult(remote[0])
    }
  }

  // Peele pin ki jaankari bharne ka mode
  function confirmUpdate(place) {
    setMode('update')
    setTarget(place)
    setForm({
      ...EMPTY_FORM,
      naam: place.naam || '',
      state: place.state || '',
      type: place.type || 'other',
      history: place.history || '',
      builtBy: place.builtBy || '',
      era: place.era || '',
      sourcesText: (place.sources || []).join(', '),
    })
    setConfirmed(true)
    setPendingPin(null)
    setDismissedId(null)
    onLocationChosen({ lat: place.lat, lng: place.lng })
    setMiniFly({ lat: place.lat, lng: place.lng, zoom: 15 })
  }

  // "Nahi, ye nayi jagah hai": normal new mode, location pin wali jagah par
  function declineUpdate(place) {
    setPendingPin(null)
    setDismissedId(place._id)
    setConfirmed(false)
    onLocationChosen({ lat: place.lat, lng: place.lng })
  }

  function cancelUpdate() {
    setMode('new')
    setTarget(null)
    setForm(EMPTY_FORM)
    setConfirmed(false)
  }

  // Khali jagah par click ya marker drag: nayi location
  function handleMapClick(loc) {
    moveLocation(loc)
  }

  async function handlePhoto(e) {
    const chosen = e.target.files?.[0]
    if (!chosen) return
    try {
      setField('photo', await readImageAsDataUrl(chosen))
    } catch {
      setError(t('photoError'))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.naam.trim()) {
      setError(t('nameRequired'))
      return
    }
    if (mode === 'new') {
      if (!location) {
        setError(t('locationNeeded'))
        return
      }
      if (!confirmed) {
        setError(t('confirmLocationFirst'))
        return
      }
    }

    setSaving(true)
    setError('')
    const fields = {
      naam: form.naam.trim(),
      state: form.state.trim(),
      type: form.type,
      history: form.history.trim(),
      builtBy: form.builtBy.trim(),
      era: form.era.trim(),
      // Comma se alag sources ko array banao
      sources: form.sourcesText.split(',').map((s) => s.trim()).filter(Boolean),
      contributorName: form.contributor.trim(),
      locationApprox: form.approx,
    }
    if (form.photo) fields.photo = form.photo

    try {
      let place
      if (mode === 'update') {
        // PUT: backend status ko "community" kar deta hai
        place = await updatePlace(target._id, fields)
      } else {
        place = await createPlace({
          ...fields,
          lat: location.lat,
          lng: location.lng,
          locationSource: 'user',
          status: 'community',
        })
      }
      setForm(EMPTY_FORM)
      setMode('new')
      setTarget(null)
      setConfirmed(false)
      setPicked(false)
      setPickedPoint(null)
      setSearchMarker(null)
      setHighlightId(null)
      clearSearchLists()
      onCreated(place)
    } catch {
      setError(t('saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const locked = mode === 'update'

  return (
    <div className="modal-backdrop" hidden={!open}>
      <form className="modal card" onSubmit={handleSubmit}>
        <div className="modal-head">
          <h3>{t('addPlaceTitle')}</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={t('close')}>
            ×
          </button>
        </div>

        {locked && (
          <div className="update-badge">
            <span>{t('updatingBadge', { naam: target.naam })}</span>
            <button type="button" className="btn ghost small" onClick={cancelUpdate}>
              {t('cancelUpdate')}
            </button>
          </div>
        )}

        {/* Location search */}
        <div className="search-location">
          <div className="row">
            <input
              className="input"
              placeholder={t('locationSearchPlaceholder')}
              value={query}
              disabled={locked}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                // Enter form submit na kare, search kare
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleSearch()
                }
              }}
            />
            <button
              type="button"
              className="btn ghost small"
              onClick={handleSearch}
              disabled={searching || locked}
            >
              {searching ? t('searching') : t('searchBtn')}
            </button>
          </div>
          {searchError && <p className="error">{searchError}</p>}
          {didYouMean && <p className="muted">{t('didYouMean')}</p>}
          {localResults.length + results.length > 0 && (
            <ul className="results">
              {localResults.length > 0 && <li className="result-group">{t('onVirasat')}</li>}
              {localResults.map((p) => (
                <li key={p._id}>
                  <button type="button" className="result-item" onClick={() => chooseLocal(p)}>
                    <span className={`dot ${p.status}`} />
                    <span>{p.naam}</span>
                    <small>{p.state}</small>
                  </button>
                </li>
              ))}
              {results.length > 0 && <li className="result-group">{t('placesInIndia')}</li>}
              {results.map((r) => (
                <li key={`${r.lat},${r.lng}`}>
                  <button type="button" className="result-item" onClick={() => chooseResult(r)}>
                    <span>{r.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {noMatches && <p className="muted">{t('noResults')}</p>}
        </div>

        {/* Mini map: saare pins, peela pin click = update, khali jagah = nayi location */}
        {/* Help text: pehle kuch nahi. Marker lag gaya to "drag ya tap", warna search result chuna ho to uska hint */}
        {mode === 'new' && location ? (
          <p className="muted">{t('adjustHint')}</p>
        ) : (
          picked && <p className="muted">{hasSavedNearby ? t('miniMapHint') : t('noSavedHere')}</p>
        )}
        <MiniMap
          places={places}
          location={location}
          flyTarget={miniFly}
          locked={locked}
          searchMarker={searchMarker}
          highlightId={highlightId}
          onSearchMarkerClick={handleMapClick}
          onMapClick={handleMapClick}
          onPinClick={setPendingPin}
          onMarkerDrag={handleMapClick}
        />
        <p className="map-legend">{t('miniMapLegend')}</p>

        {pendingPin && (
          <div className="confirm-box warn">
            <p>{t('confirmUpdateQ', { naam: pendingPin.naam })}</p>
            <div className="row">
              <button type="button" className="btn primary small" onClick={() => confirmUpdate(pendingPin)}>
                {t('yesUpdate')}
              </button>
              <button type="button" className="btn ghost small" onClick={() => declineUpdate(pendingPin)}>
                {t('noNewPlace')}
              </button>
            </div>
          </div>
        )}

        {nearby && (
          <div className="confirm-box warn">
            <p>{t('nearbyWarn', { naam: nearby.naam })}</p>
            <div className="row">
              <button type="button" className="btn primary small" onClick={() => confirmUpdate(nearby)}>
                {t('nearbyYes')}
              </button>
              <button type="button" className="btn ghost small" onClick={() => setDismissedId(nearby._id)}>
                {t('nearbyNo')}
              </button>
            </div>
          </div>
        )}

        <div className="location-row">
          <span>📍 {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : t('noLocation')}</span>
          <div className="row">
            <button type="button" className="btn ghost small" onClick={onUseCurrent} disabled={locked}>
              {t('useCurrentLocation')}
            </button>
            <button type="button" className="btn ghost small" onClick={onPickOnMap} disabled={locked}>
              {t('pickOnMap')}
            </button>
          </div>
        </div>

        {/* Preview: sahi jagah confirm karna zaroori (nayi jagah mein) */}
        {mode === 'new' && location && (
          <div className="confirm-box">
            <p>{t('confirmLocationQ')}</p>
            {confirmed ? (
              <span className="ok-note">{t('confirmedNote')}</span>
            ) : (
              <button type="button" className="btn primary small" onClick={() => setConfirmed(true)}>
                {t('confirmLocationYes')}
              </button>
            )}
          </div>
        )}

        <input
          className="input"
          placeholder={t('placeNamePlaceholder')}
          value={form.naam}
          onChange={(e) => setField('naam', e.target.value)}
        />

        <div className="row modal-row">
          <input
            className="input"
            placeholder={t('statePlaceholder')}
            value={form.state}
            onChange={(e) => setField('state', e.target.value)}
          />
          <select className="input" value={form.type} onChange={(e) => setField('type', e.target.value)}>
            <option value="baoli">{t('typeBaoli')}</option>
            <option value="kila">{t('typeFort')}</option>
            <option value="mandir">{t('typeTemple')}</option>
            <option value="other">{t('typeOther')}</option>
          </select>
        </div>

        <textarea
          className="input"
          rows={3}
          placeholder={t('storyPlaceholder')}
          value={form.history}
          onChange={(e) => setField('history', e.target.value)}
        />

        <div className="row modal-row">
          <input
            className="input"
            placeholder={t('builtByPlaceholder')}
            value={form.builtBy}
            onChange={(e) => setField('builtBy', e.target.value)}
          />
          <input
            className="input"
            placeholder={t('eraPlaceholder')}
            value={form.era}
            onChange={(e) => setField('era', e.target.value)}
          />
        </div>

        <input
          className="input"
          placeholder={t('sourcesPlaceholder')}
          value={form.sourcesText}
          onChange={(e) => setField('sourcesText', e.target.value)}
        />

        <input
          className="input"
          placeholder={t('contributorPlaceholder')}
          value={form.contributor}
          onChange={(e) => setField('contributor', e.target.value)}
        />

        {!locked && (
          <label className="check-row">
            <input
              type="checkbox"
              checked={form.approx}
              onChange={(e) => setField('approx', e.target.checked)}
            />
            <span>{t('approxArea')}</span>
          </label>
        )}

        <label className="file-field">
          <span>{t('photoOptional')}</span>
          <input type="file" accept="image/*" onChange={handlePhoto} />
        </label>
        {form.photo && <img className="form-photo-preview" src={form.photo} alt="" />}

        <div className="row">
          <button className="btn primary" disabled={saving}>
            {saving ? t('saving') : t('submitPlace')}
          </button>
          <button type="button" className="btn ghost" onClick={onClose}>
            {t('cancel')}
          </button>
        </div>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  )
}
