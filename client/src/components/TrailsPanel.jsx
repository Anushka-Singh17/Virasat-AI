import { useLanguage } from '../i18n/LanguageContext'

// Ek section: heading + trails ki list (har item par click se trail shuru)
function TrailSection({ titleKey, trails, onChoose, t }) {
  if (trails.length === 0) return null
  return (
    <div className="trail-section">
      <h4 className="trail-section-title">{t(titleKey)}</h4>
      <ul className="trail-list">
        {trails.map((trail) => (
          <li key={trail.id}>
            <button className="trail-item" onClick={() => onChoose(trail.id)}>
              <span>{trail.title}</span>
              <small>{t('stopsCount', { n: trail.stops.length })}</small>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function TrailsPanel({
  featured,
  regions,
  activeId,
  stopIndex,
  stopCount,
  onChoose,
  onPrev,
  onNext,
  onExit,
}) {
  const { t } = useLanguage()
  const trail = [...featured, ...regions].find((tr) => tr.id === activeId)

  // Koi trail chuni nahi hai (ya chuni hui trail ab list mein nahi): do sections dikhao
  if (!trail) {
    return (
      <section className="card trails">
        <h3>{t('trailsTitle')}</h3>
        <div className="trail-sections">
          <TrailSection titleKey="trailsFeatured" trails={featured} onChoose={onChoose} t={t} />
          <TrailSection titleKey="trailsByRegion" trails={regions} onChoose={onChoose} t={t} />
        </div>
      </section>
    )
  }

  // Trail chal rahi hai: stop ka counter aur Prev / Next / Exit
  return (
    <section className="card trails">
      <h3>{trail.title}</h3>
      <p className="meta">
        {stopIndex === null
          ? t('trailStart')
          : t('stopCounter', { n: stopIndex + 1, total: stopCount })}
      </p>
      <div className="row trail-controls">
        <button
          className="btn ghost small"
          onClick={onPrev}
          disabled={stopIndex === null || stopIndex === 0}
        >
          {t('prevStop')}
        </button>
        <button
          className="btn primary small"
          onClick={onNext}
          disabled={stopCount === 0 || stopIndex === stopCount - 1}
        >
          {t('nextStop')}
        </button>
        <button className="btn ghost small" onClick={onExit}>
          {t('exitTrail')}
        </button>
      </div>
    </section>
  )
}
