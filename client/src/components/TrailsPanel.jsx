import { useLanguage } from '../i18n/LanguageContext'

export default function TrailsPanel({
  trails,
  activeId,
  stopIndex,
  stopCount,
  onChoose,
  onPrev,
  onNext,
  onExit,
}) {
  const { t } = useLanguage()

  // Koi trail chuni nahi hai: trails ki list dikhao
  if (!activeId) {
    return (
      <section className="card trails">
        <h3>{t('trailsTitle')}</h3>
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
      </section>
    )
  }

  // Trail chal rahi hai: stop ka counter aur Prev / Next / Exit
  const trail = trails.find((tr) => tr.id === activeId)
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
