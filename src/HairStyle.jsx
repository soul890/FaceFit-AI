import { useState, useRef } from 'react'
import { t } from './i18n'

function downloadImage(base64, filename) {
  const link = document.createElement('a')
  link.href = `data:image/png;base64,${base64}`
  link.download = filename
  link.click()
}

export default function HairStyle({ lang, onBack, onSelect, selected }) {
  const [photo, setPhoto] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [resultImage, setResultImage] = useState(null)
  const [resultText, setResultText] = useState(null)
  const [error, setError] = useState(null)
  const cameraRef = useRef(null)
  const galleryRef = useRef(null)

  const handlePhoto = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhoto(URL.createObjectURL(file))
      setPhotoFile(file)
    }
  }

  const handleSubmit = async () => {
    if (!photoFile) return
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('image', photoFile)
      formData.append('lang', lang)

      const res = await fetch('/api/hairstyle', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to generate hairstyles')
      }

      const data = await res.json()
      setResultImage(data.imageBase64)
      setResultText(data.textContent)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setResultImage(null)
    setResultText(null)
    setError(null)
    setPhoto(null)
    setPhotoFile(null)
  }

  if (loading) {
    return (
      <div className="app loading-screen">
        <div className="loader" />
        <p className="loading-text">{t(lang, 'hairLoading')}</p>
        <p className="loading-sub">{t(lang, 'hairLoadingSub')}</p>
      </div>
    )
  }

  if (resultImage) {
    return (
      <div className="app">
        <header className="header">
          <h1>{t(lang, 'hairResult')}</h1>
          <p>{t(lang, 'hairResultSub')}</p>
        </header>

        <div className="card hair-result-card">
          <img
            className="hair-result-image"
            src={`data:image/png;base64,${resultImage}`}
            alt="Hairstyle recommendations"
          />
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button
              className="download-btn"
              onClick={() => downloadImage(resultImage, 'hairstyle-recommendation.png')}
            >
              {t(lang, 'downloadImage')}
            </button>
            <button
              className={`download-btn ${selected ? 'selected-btn' : 'select-btn'}`}
              onClick={() => onSelect?.(resultImage)}
            >
              {selected ? t(lang, 'selectedForFinal') : t(lang, 'selectForFinal')}
            </button>
          </div>
        </div>

        {resultText && (
          <div className="card hair-text-card">
            <h2>{t(lang, 'styleDetails')}</h2>
            <p className="hair-text-content">{resultText}</p>
          </div>
        )}

        <div className="cta-container">
          <button className="cta-btn" onClick={handleReset}>
            {t(lang, 'tryAgain')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <button className="back-btn" onClick={onBack}>{t(lang, 'back')}</button>
        <h1>{t(lang, 'hairTitle')}</h1>
        <p>{t(lang, 'hairSubtitle')}</p>
      </header>

      {error && <div className="error-msg">{error}</div>}

      <div className="card">
        <h2>{t(lang, 'photo')}</h2>
        <div className="photo-buttons">
          <button className="photo-btn" onClick={() => cameraRef.current?.click()}>
            <span className="icon">📷</span>
            {t(lang, 'camera')}
          </button>
          <button className="photo-btn" onClick={() => galleryRef.current?.click()}>
            <span className="icon">🖼️</span>
            {t(lang, 'gallery')}
          </button>
        </div>
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={handlePhoto}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handlePhoto}
        />
        {photo && (
          <div className="photo-preview">
            <img src={photo} alt="Preview" />
            <div className="face-guide-overlay">
              <div className="face-guide-oval">
                <span className="face-guide-text">{t(lang, 'faceGuide')}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="cta-container">
        <button className="cta-btn" disabled={!photoFile} onClick={handleSubmit}>
          {t(lang, 'getRecommendations')}
        </button>
      </div>
    </div>
  )
}
