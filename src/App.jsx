import { useState, useRef, useEffect, useCallback } from 'react'
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
import SubscriptionModal from './SubscriptionModal'
import SubscriptionSuccess from './SubscriptionSuccess'

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

  // Subscription state
  const [subscriptionActive, setSubscriptionActive] = useState(false)
  const [customerId, setCustomerId] = useState(null)
  const [freeUsed, setFreeUsed] = useState(false)
  const [showSubModal, setShowSubModal] = useState(false)
  const [usageInfo, setUsageInfo] = useState(null)

  // Restore subscription state from localStorage on mount
  useEffect(() => {
    const cid = localStorage.getItem('beauty_customer_id')
    const subActive = localStorage.getItem('beauty_sub_active') === '1'
    const used = localStorage.getItem('beauty_free_used') === '1'

    if (cid) {
      setCustomerId(cid)
      setSubscriptionActive(subActive)
      // Re-verify in background
      fetch('/api/verify-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: cid }),
      })
        .then((r) => r.json())
        .then((data) => {
          setSubscriptionActive(data.active)
          localStorage.setItem('beauty_sub_active', data.active ? '1' : '0')
          if (data.usage !== undefined) setUsageInfo({ usage: data.usage, limit: data.limit, remaining: data.remaining })
        })
        .catch(() => {})
    }
    if (used) setFreeUsed(true)

    // Check URL for success page
    const params = new URLSearchParams(window.location.search)
    if (params.get('page') === 'success' || params.get('checkout_id')) {
      setPage('success')
    }
  }, [])

  const handleSelect = (key, base64) => {
    setSelections((prev) => ({ ...prev, [key]: base64 }))
  }

  const selectedCount = Object.values(selections).filter(Boolean).length

  const handlePhotoFile = (file) => {
    setPhoto(URL.createObjectURL(file))
    setPhotoFile(file)
    setPage('hub')
  }

  // Check if user can use a service; returns true if allowed
  const checkAccess = useCallback((service) => {
    // Skin analysis: free users get 1 use
    if (service === 'skin') {
      if (subscriptionActive) return true
      if (!freeUsed) return true
      setShowSubModal(true)
      return false
    }
    // All other services require subscription
    if (!subscriptionActive) {
      setShowSubModal(true)
      return false
    }
    // Check monthly limit
    if (usageInfo && usageInfo.remaining <= 0) {
      setShowSubModal(true)
      return false
    }
    return true
  }, [subscriptionActive, freeUsed, usageInfo])

  const incrementUsage = async () => {
    if (!customerId) return
    try {
      const res = await fetch('/api/increment-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId }),
      })
      const data = await res.json()
      if (data.usage !== undefined) {
        setUsageInfo({ usage: data.usage, limit: data.limit, remaining: data.remaining })
      }
    } catch {}
  }

  const handleNavigate = (target) => {
    const premiumServices = ['hairstyle', 'diet', 'makeup', 'fashion']
    if (premiumServices.includes(target)) {
      if (!checkAccess(target)) return
    }
    if (target === 'skin' && !checkAccess('skin')) return
    setPage(target)
  }

  const handleSubmit = async () => {
    if (!photoFile) return

    // Check access for skin analysis
    if (!subscriptionActive && freeUsed) {
      setShowSubModal(true)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('image', photoFile)
      formData.append('lang', lang)

      const res = await fetch('/api/skin-analysis', {
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

      // Mark free use consumed
      if (!subscriptionActive) {
        setFreeUsed(true)
        localStorage.setItem('beauty_free_used', '1')
      } else {
        await incrementUsage()
      }
    } catch (e) {
      setError(e.message)
      setPage('skin')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setError(null)
    setPage('hub')
  }

  const handleSubscriptionComplete = (cid, active) => {
    if (cid) {
      setCustomerId(cid)
      setSubscriptionActive(active)
    }
    setPage('hub')
  }

  // Success page
  if (page === 'success') {
    return <SubscriptionSuccess lang={lang} onComplete={handleSubscriptionComplete} />
  }

  // Individual service pages
  if (page === 'hairstyle') {
    return <HairStyle lang={lang} onBack={() => setPage('hub')} onSelect={(b64) => { handleSelect('hair', b64); if (subscriptionActive) incrementUsage() }} selected={!!selections.hair} />
  }

  if (page === 'diet') {
    return <Diet lang={lang} onBack={() => setPage('hub')} onSelect={(b64) => { handleSelect('diet', b64); if (subscriptionActive) incrementUsage() }} selected={!!selections.diet} />
  }

  if (page === 'makeup') {
    return <Makeup lang={lang} onBack={() => setPage('hub')} onSelect={(b64) => { handleSelect('makeup', b64); if (subscriptionActive) incrementUsage() }} selected={!!selections.makeup} />
  }

  if (page === 'fashion') {
    return <Fashion lang={lang} onBack={() => setPage('hub')} onSelect={(b64) => { handleSelect('fashion', b64); if (subscriptionActive) incrementUsage() }} selected={!!selections.fashion} />
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
        onNavigate={handleNavigate}
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
        photoFile={photoFile}
        selections={selections}
        onSelect={handleSelect}
        onReset={handleReset}
        onNavigate={handleNavigate}
      />
    )
  }

  // Service Hub (1-2 page)
  if (page === 'hub') {
    return (
      <>
        <ServiceHub
          lang={lang}
          userName={userName}
          photo={photo}
          onNavigate={handleNavigate}
          subscriptionActive={subscriptionActive}
          onUpgrade={() => setShowSubModal(true)}
          usageInfo={usageInfo}
        />
        {showSubModal && (
          <SubscriptionModal lang={lang} onClose={() => setShowSubModal(false)} />
        )}
      </>
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
    <>
      <Home
        lang={lang}
        setLang={setLang}
        onStartGlowUp={() => setPage('profile')}
      />
      {showSubModal && (
        <SubscriptionModal lang={lang} onClose={() => setShowSubModal(false)} />
      )}
    </>
  )
}

export default App
