const TYPE_CHIPS = [
  { value: 'all', label: 'All' },
  { value: 'baoli', label: 'Baoli' },
  { value: 'kila', label: 'Kila' },
  { value: 'mandir', label: 'Mandir' },
]

export default function SearchBar({ query, onQueryChange, typeFilter, onTypeChange, results, onResultClick }) {
  return (
    <div className="card search">
      <input
        className="input"
        type="search"
        placeholder="Naam, state ya type se dhundho..."
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
            {chip.label}
          </button>
        ))}
      </div>

      {query.trim() && (
        <ul className="results">
          {results.length === 0 && <li className="muted">Koi jagah nahi mili</li>}
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
