import { useState, useRef } from 'react'
import './App.css'
import { t } from './i18n'
import Home from './Home'
import ProfileSetup from './ProfileSetup'
import ServiceHub from './ServiceHub'
import PhotoUpload from './PhotoUpload'
import SkinResult from './SkinResult'
import HairStyle from './HairStyle'
import Diet from './Diet'
import Makeup from './Makeup'
import Fashion from './Fashion'
import FinalResult from './FinalResult'

function App() {
  const [lang, setLang] = useState('ko')
  const [page, setPage] = useState('home')
  const [userName, setUserName] = useState('')
  const [photo, setPhoto] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [selections, setSelections] = useState({ skin: null, hair: null, diet: null, makeup: null, fashion: null })

  const handleSelect = (key, base64) => {
    setSelections((prev) => ({ ...prev, [key]: base64 }))
  }

  const selectedCount = Object.values(selections).filter(Boolean).length

  const handlePhotoFile = (file) => {
    setPhoto(URL.createObjectURL(file))
    setPhotoFile(file)
    setPage('hub')
  }

  const handleSubmit = async () => {
    if (!photoFile) return
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('image', photoFile)
      formData.append('lang', lang)

      const res = await fetch('/api/diagnose', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const text = await res.text()
        let msg = 'Analysis failed'
        try { msg = JSON.parse(text).error || msg } catch {}
        throw new Error(msg)
      }

      const text = await res.text()
      if (!text) throw new Error('Empty response from server')
      const data = JSON.parse(text)
      setResult(data)
      setPage('result')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setError(null)
    setPage('hub')
  }

  // Individual service pages
  if (page === 'hairstyle') {
    return <HairStyle lang={lang} onBack={() => setPage('hub')} onSelect={(b64) => handleSelect('hair', b64)} selected={!!selections.hair} />
  }

  if (page === 'diet') {
    return <Diet lang={lang} onBack={() => setPage('hub')} onSelect={(b64) => handleSelect('diet', b64)} selected={!!selections.diet} />
  }

  if (page === 'makeup') {
    return <Makeup lang={lang} onBack={() => setPage('hub')} onSelect={(b64) => handleSelect('makeup', b64)} selected={!!selections.makeup} />
  }

  if (page === 'fashion') {
    return <Fashion lang={lang} onBack={() => setPage('hub')} onSelect={(b64) => handleSelect('fashion', b64)} selected={!!selections.fashion} />
  }

  if (page === 'final') {
    return <FinalResult lang={lang} selections={selections} originalPhoto={photoFile} onBack={() => setPage('hub')} />
  }

  if (loading) {
    return (
      <div className="app loading-screen">
        <div className="home-bg" />
        <div className="loader" />
        <p className="loading-text">{t(lang, 'analyzingText')}</p>
        <p className="loading-sub">{t(lang, 'analyzingSub')}</p>
      </div>
    )
  }

  // Skin analysis flow
  if (page === 'skin') {
    return (
      <PhotoUpload
        lang={lang}
        setLang={setLang}
        photo={photo}
        photoFile={photoFile}
        error={error}
        selections={selections}
        selectedCount={selectedCount}
        onPhoto={(file) => { setPhoto(URL.createObjectURL(file)); setPhotoFile(file) }}
        onSubmit={handleSubmit}
        onNavigate={setPage}
        onBack={() => setPage('hub')}
      />
    )
  }

  if (page === 'result' && result) {
    return (
      <SkinResult
        lang={lang}
        result={result}
        photo={photo}
        selections={selections}
        onSelect={handleSelect}
        onReset={handleReset}
        onNavigate={setPage}
      />
    )
  }

  // Service Hub (1-2 page)
  if (page === 'hub') {
    return (
      <ServiceHub
        lang={lang}
        userName={userName}
        photo={photo}
        onNavigate={setPage}
      />
    )
  }

  // Profile Setup (1-1 page)
  if (page === 'profile') {
    return (
      <ProfileSetup
        lang={lang}
        setLang={setLang}
        userName={userName}
        setUserName={setUserName}
        onPhoto={handlePhotoFile}
        onBack={() => setPage('home')}
        onSkip={() => setPage('hub')}
      />
    )
  }

  // Home landing
  return (
    <Home
      lang={lang}
      setLang={setLang}
      onStartGlowUp={() => setPage('profile')}
    />
  )
}

export default App
