import { useLanguage } from '../i18n/LanguageContext'

// Map ke upar halka overlay: "server jaag raha hai" ya (60 second baad bhi na aaye to) error + Retry.
// Hamesha mounted rehta hai; dikhna/chhupna sirf CSS (opacity) se hota hai, isliye fade smooth hai.
export default function ServerOverlay({ waking, error, onRetry }) {
  const { t } = useLanguage()
  const visible = waking || error

  return (
    <div
      className={`server-overlay ${visible ? 'is-visible' : ''}`}
      role="status"
      aria-live="polite"
      aria-hidden={!visible}
    >
      <div className="server-card">
        {error ? (
          <>
            <p className="server-text">{t('serverDown')}</p>
            <button type="button" className="btn primary" onClick={onRetry}>
              {t('retryBtn')}
            </button>
          </>
        ) : (
          <>
            <div className="server-spinner" aria-hidden="true" />
            <p className="server-text">{t('serverWaking')}</p>
          </>
        )}
      </div>
    </div>
  )
}
