import { useLanguage } from '../i18n/LanguageContext'

const TYPE_CHIPS = [
  { value: 'all', key: 'filterAll' },
  { value: 'baoli', key: 'typeBaoli' },
  { value: 'kila', key: 'typeFort' },
  { value: 'mandir', key: 'typeTemple' },
]

export default function SearchBar({ query, onQueryChange, typeFilter, onTypeChange, results, onResultClick }) {
  const { t } = useLanguage()

  return (
    <div className="card search">
      <input
        className="input"
        type="search"
        placeholder={t('searchPlaceholder')}
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
      />

      <div className="chips">
        {TYPE_CHIPS.map((chip) => (
          <button
            key={chip.value}
            className={`chip ${typeFilter === chip.value ? 'active' : ''}`}
            onClick={() => onTypeChange(chip.value)}
          >
            {t(chip.key)}
          </button>
        ))}
      </div>

      {query.trim() && (
        <ul className="results">
          {results.length === 0 && <li className="muted">{t('noPlacesFound')}</li>}
          {results.map((p) => (
            <li key={p._id}>
              <button className="result-item" onClick={() => onResultClick(p)}>
                <span className={`dot ${p.status}`} />
                <span>{p.naam}</span>
                <small>{p.state}</small>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
