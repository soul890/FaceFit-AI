import { useState, useRef } from 'react'
import { t } from './i18n'
import LanguageSelector from './LanguageSelector'

function ProfileSetup({ lang, setLang, userName, setUserName, onPhoto, onBack, onSkip }) {
  const [name, setName] = useState(userName || '')
  const galleryRef = useRef(null)
  const cameraRef = useRef(null)

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setUserName(name.trim())
      onPhoto(file)
    }
  }

  return (
    <div className="setup-page">
      {/* Decorative blurs */}
      <div className="setup-blur-tr" />
      <div className="setup-blur-bl" />

      {/* Top bar */}
      <div className="setup-topbar">
        <div className="setup-back" onClick={onBack}>
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </div>
        <div style={{ flex: 1 }} />
        <LanguageSelector lang={lang} setLang={setLang} />
      </div>

      {/* Headline */}
      <div className="setup-headline">
        <h1>{t(lang, 'setupHeadline')}</h1>
      </div>
      <p className="setup-body">
        {t(lang, 'setupBody')}
      </p>

      {/* Upload area */}
      <div className="setup-input-area">
        <div className="setup-input-card" onClick={() => galleryRef.current?.click()}>
          <div className="setup-input-icon-wrap">
            <span className="material-symbols-outlined" style={{ fontSize: 36 }}>add_a_photo</span>
          </div>
          <div className="setup-input-content">
            <p className="setup-input-label">{t(lang, 'uploadPhoto')}</p>
            <p className="setup-input-hint">{t(lang, 'uploadHint')}</p>
          </div>
          <button
            className="setup-select-photo-btn"
            onClick={(e) => { e.stopPropagation(); galleryRef.current?.click() }}
          >
            {t(lang, 'selectPhoto')}
          </button>
        </div>
        <input ref={galleryRef} type="file" accept="image/*" hidden onChange={handleFile} />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={handleFile} />
      </div>

      {/* Name input */}
      <div className="setup-name-area">
        <div className="setup-name-card">
          <div className="setup-name-icon-wrap">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>person</span>
          </div>
          <input
            className="setup-name-input"
            type="text"
            placeholder={t(lang, 'namePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      </div>

      {/* Pro Tip */}
      <div className="setup-tip-wrap">
        <div className="setup-tip">
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>lightbulb</span>
          <div>
            <p className="setup-tip-title">{t(lang, 'proTipTitle')}</p>
            <p className="setup-tip-desc">{t(lang, 'proTipDesc')}</p>
          </div>
        </div>
      </div>

      {/* Bottom action */}
      <div className="setup-bottom">
        <button
          className="setup-camera-btn"
          onClick={() => cameraRef.current?.click()}
        >
          {t(lang, 'takeNewPhoto')}
        </button>
        <p className="setup-skip-text" onClick={onSkip}>
          {t(lang, 'skipBrowse')}
        </p>
      </div>
    </div>
  )
}

export default ProfileSetup
