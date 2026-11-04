import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'

// Number ko purani value se nayi value tak count-up karke dikhata hai
function CountUp({ value }) {
  const [display, setDisplay] = useState(value)
  const shown = useRef(value)

  useEffect(() => {
    const from = shown.current
    if (from === value) return

    const start = performance.now()
    let frame
    const step = (now) => {
      const progress = Math.min((now - start) / 600, 1)
      const current = Math.round(from + (value - from) * progress)
      shown.current = current
      setDisplay(current)
      if (progress < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [value])

  return display
}

export default function StatsBar({ total, verified, unknown, updatedAt }) {
  const { t } = useLanguage()
  const [now, setNow] = useState(() => Date.now())

  // Har 30 second mein "2 min ago" wala time refresh hota hai
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(timer)
  }, [])

  // Stats abhi aaye nahi (server jaag raha hai / fail): number ki jagah "—" dikhao
  const loaded = total != null && verified != null && unknown != null
  const show = (value) => (loaded ? <CountUp value={value} /> : '—')

  const minutes = Math.max(0, Math.floor((now - updatedAt) / 60000))
  const updatedText = minutes < 1 ? t('updatedJustNow') : t('updatedMinAgo', { n: minutes })

  return (
    <div className="stats-wrap">
      <div className="stats">
        <div className="stat">
          <span className="stat-icon" aria-hidden="true">
            📍
          </span>
          <strong>{show(total)}</strong>
          <span className="stat-label">{t('totalPlaces')}</span>
        </div>
        <div className="stat">
          <span className="stat-icon" aria-hidden="true">
            ✅
          </span>
          <strong className="text-green">{show(verified)}</strong>
          <span className="stat-label">{t('verified')}</span>
        </div>
        <div className="stat">
          <span className="stat-icon" aria-hidden="true">
            🟡
          </span>
          <strong className="text-yellow">{show(unknown)}</strong>
          <span className="stat-label">{t('unknown')}</span>
        </div>
      </div>
      {/* Data aane se pehle "Updated just now" jhooth hoga, isliye tab chhupa do */}
      {loaded && (
        <p className="stats-updated">
          <span className="live-dot" />
          {updatedText}
        </p>
      )}
    </div>
  )
}
