import { useState } from 'react'
import { LANGUAGES } from './i18n'

function LanguageSelector({ lang, setLang }) {
  const [open, setOpen] = useState(false)
  const current = LANGUAGES.find((l) => l.code === lang)

  return (
    <div className="lang-selector">
      <button className="lang-btn" onClick={() => setOpen(!open)}>
        {current?.flag} {current?.name}
      </button>
      {open && (
        <div className="lang-dropdown">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              className={`lang-option ${l.code === lang ? 'active' : ''}`}
              onClick={() => { setLang(l.code); setOpen(false) }}
            >
              {l.flag} {l.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default LanguageSelector
