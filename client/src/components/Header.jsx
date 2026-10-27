import { LANGUAGES, useLanguage } from '../i18n/LanguageContext'

export default function Header({ isMock, onAddPlace }) {
  const { lang, setLang, t } = useLanguage()

  return (
    <header className="header">
      <div>
        <h1 className="brand">Heritage Map</h1>
        <p className="tagline">{t('tagline')}</p>
      </div>
      <div className="header-right">
        <button className="add-place-btn" onClick={onAddPlace}>
          {t('addPlaceBtn')}
        </button>
        {isMock && <span className="demo-pill">{t('demoMode')}</span>}
        <select
          className="lang-select"
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          aria-label="Language"
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </div>
    </header>
  )
}
