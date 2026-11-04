import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import './Welcome.css'

const SEEN_KEY = 'seenIntro'

// Intro pehle dekh chuke hain ya nahi (localStorage band ho to "nahi dekha" maanenge)
function hasSeenIntro() {
  try {
    return localStorage.getItem(SEEN_KEY) === 'true'
  } catch {
    return false
  }
}

function markIntroSeen() {
  try {
    localStorage.setItem(SEEN_KEY, 'true')
  } catch {
    // save nahi hua to koi baat nahi, bas agli baar intro dobara dikhega
  }
}

// 3 onboarding slides
const SLIDES = [
  { emoji: '🗺️', titleKey: 'introExploreTitle', textKey: 'introExploreText' },
  { emoji: '📸', titleKey: 'introIdentifyTitle', textKey: 'introIdentifyText' },
  { emoji: '🙋', titleKey: 'introContributeTitle', textKey: 'introContributeText' },
]

// Apna simple illustration (koi copyrighted image nahi): ek ke andar ek mehrab (arch) aur suraj
function HeritageArt() {
  return (
    <svg className="welcome-art" viewBox="0 0 400 280" aria-hidden="true">
      <circle cx="200" cy="82" r="34" fill="#e0a800" opacity="0.55" />
      <path d="M40 280 V150 Q40 20 200 20 Q360 20 360 150 V280 Z" fill="#b5532e" opacity="0.16" />
      <path d="M80 280 V160 Q80 60 200 60 Q320 60 320 160 V280 Z" fill="#b5532e" opacity="0.26" />
      <path d="M120 280 V170 Q120 100 200 100 Q280 100 280 170 V280 Z" fill="#8f3e20" opacity="0.4" />
      <path d="M160 280 V190 Q160 140 200 140 Q240 140 240 190 V280 Z" fill="#4a2c1a" opacity="0.55" />
    </svg>
  )
}

// "/" par Welcome page HAMESHA dikhta hai (kabhi redirect nahi).
// Slides sirf pehli baar "Explore the map" par aate hain, ya kabhi bhi "How it works" par.
export default function Welcome() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [step, setStep] = useState(0) // 0 = welcome screen, 1 se 3 = slides
  const [direction, setDirection] = useState('next') // animation ki disha
  const touchStartX = useRef(null)

  const lastStep = SLIDES.length

  function goTo(next) {
    if (next < 0 || next > lastStep) return
    setDirection(next > step ? 'next' : 'back')
    setStep(next)
  }

  // Skip ya Get started: intro "dekha hua" maan kar map par
  function finish() {
    markIntroSeen()
    navigate('/map')
  }

  // "Explore the map": pehli baar slides dikhao, uske baad seedha map
  function exploreMap() {
    if (hasSeenIntro()) navigate('/map')
    else goTo(1)
  }

  // Slides par keyboard ke arrow keys se bhi aage-peeche
  useEffect(() => {
    if (step === 0) return
    function onKey(e) {
      if (e.key === 'ArrowRight' && step < lastStep) {
        setDirection('next')
        setStep(step + 1)
      }
      if (e.key === 'ArrowLeft') {
        setDirection('back')
        setStep(step - 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [step, lastStep])

  // Mobile par swipe: 50px se zyada khinche to aage/peeche
  function onTouchStart(e) {
    touchStartX.current = e.touches[0].clientX
  }

  function onTouchEnd(e) {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (dx < -50) goTo(step + 1)
    else if (dx > 50) goTo(step - 1)
  }

  // ---------- Welcome screen ----------
  if (step === 0) {
    return (
      <main className="welcome">
        <div className="welcome-content">
          <h1 className="welcome-title">Virasat AI</h1>
          <p className="welcome-tagline">{t('tagline')}</p>
          <button type="button" className="welcome-cta" onClick={exploreMap}>
            {t('exploreMapBtn')}
          </button>
          {/* Slides kabhi bhi dobara dekhne ke liye */}
          <button type="button" className="welcome-link" onClick={() => goTo(1)}>
            {t('howItWorks')}
          </button>
        </div>
        <HeritageArt />
      </main>
    )
  }

  // ---------- Onboarding slides ----------
  const slide = SLIDES[step - 1]
  const isLast = step === lastStep

  return (
    <main className="welcome">
      <button type="button" className="intro-skip" onClick={finish}>
        {t('introSkip')}
      </button>

      <div className="intro-stage" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {/* key badalne se har slide par animation dobara chalta hai */}
        <section className="intro-card" key={step} data-direction={direction}>
          <div className="intro-badge">{slide.emoji}</div>
          <h2>{t(slide.titleKey)}</h2>
          <p>{t(slide.textKey)}</p>
        </section>

        <div className="intro-dots" role="tablist" aria-label="Intro slides">
          {SLIDES.map((s, i) => (
            <button
              key={s.titleKey}
              type="button"
              role="tab"
              aria-selected={step === i + 1}
              aria-label={`${i + 1} / ${lastStep}`}
              className={`intro-dot ${step === i + 1 ? 'active' : ''}`}
              onClick={() => goTo(i + 1)}
            />
          ))}
        </div>

        <div className="intro-nav">
          <button type="button" className="intro-btn ghost" onClick={() => goTo(step - 1)}>
            {t('introBack')}
          </button>
          {isLast ? (
            <button type="button" className="intro-btn primary" onClick={finish}>
              {t('introGetStarted')}
            </button>
          ) : (
            <button type="button" className="intro-btn primary" onClick={() => goTo(step + 1)}>
              {t('introNext')}
            </button>
          )}
        </div>
      </div>
    </main>
  )
}
