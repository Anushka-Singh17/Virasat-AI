import { createContext, useContext, useEffect, useState } from 'react'
import { strings } from './strings'

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'ta', label: 'தமிழ்' },
]

const STORAGE_KEY = 'heritage-lang'
const LanguageContext = createContext(null)

// Pichli baar ki chuni hui language yaad rakhte hain (agar browser allow kare)
function readSavedLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (LANGUAGES.some((l) => l.code === saved)) return saved
  } catch {
    // storage band ho to default English
  }
  return 'en'
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(readSavedLang)

  useEffect(() => {
    document.documentElement.lang = lang
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      // save nahi hua to koi baat nahi, bas next visit par default hoga
    }
  }, [lang])

  // t('key') -> chuni hui language ka text; nahi mila to English
  function t(key) {
    const entry = strings[key]
    return entry?.[lang] ?? entry?.en ?? key
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
