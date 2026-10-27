export default function StatsBar({ total, verified, unknown }) {
  return (
    <div className="stats">
      <div className="stat">
        <strong>{total}</strong>
        <span>Total places</span>
      </div>
      <div className="stat">
        <strong className="text-green">{verified}</strong>
        <span>Verified</span>
      </div>
      <div className="stat">
        <strong className="text-yellow">{unknown}</strong>
        <span>Unknown</span>
      </div>
    </div>
  )
}
