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

  const minutes = Math.max(0, Math.floor((now - updatedAt) / 60000))
  const updatedText = minutes < 1 ? t('updatedJustNow') : t('updatedMinAgo', { n: minutes })

  return (
    <div className="stats-wrap">
      <div className="stats">
        <div className="stat">
          <strong>
            <CountUp value={total} />
          </strong>
          <span>{t('totalPlaces')}</span>
        </div>
        <div className="stat">
          <strong className="text-green">
            <CountUp value={verified} />
          </strong>
          <span>{t('verified')}</span>
        </div>
        <div className="stat">
          <strong className="text-yellow">
            <CountUp value={unknown} />
          </strong>
          <span>{t('unknown')}</span>
        </div>
      </div>
      <p className="stats-updated">{updatedText}</p>
    </div>
  )
}
