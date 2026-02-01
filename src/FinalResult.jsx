import { useState } from 'react'
import { t } from './i18n'

function downloadImage(base64, filename) {
  const link = document.createElement('a')
  link.href = `data:image/png;base64,${base64}`
  link.download = filename
  link.click()
}

const STEP_ICONS = {
  skin: '✨',
  hair: '💇',
  diet: '💪',
  makeup: '💄',
  fashion: '👗',
}

export default function FinalResult({ lang, selections, originalPhoto, onBack }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const selectedCount = Object.values(selections).filter(Boolean).length

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('lang', lang)

      if (originalPhoto) {
        formData.append('original', originalPhoto)
      }

      for (const [key, base64] of Object.entries(selections)) {
        if (base64) {
          formData.append(key, base64)
        }
      }

      const res = await fetch('/api/final', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to generate final result')
      }

      const data = await res.json()
      setResult(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="app loading-screen">
        <div className="loader" />
        <p className="loading-text">{t(lang, 'finalLoading')}</p>
        <p className="loading-sub">{t(lang, 'finalLoadingSub')}</p>
      </div>
    )
  }

  if (result) {
    return (
      <div className="app">
        <header className="header">
          <h1>{t(lang, 'finalResultTitle')}</h1>
          <p>{t(lang, 'finalResultSub')}</p>
        </header>

        {result.finalImage && (
          <div className="card hair-result-card">
            <h2>{t(lang, 'beforeAfter')}</h2>
            <img
              className="hair-result-image"
              src={`data:image/png;base64,${result.finalImage}`}
              alt="Final transformation"
            />
            <button
              className="download-btn"
              onClick={() => downloadImage(result.finalImage, 'final-transformation.png')}
            >
              {t(lang, 'downloadImage')}
            </button>
          </div>
        )}

        {result.description && (
          <div className="card hair-text-card">
            <h2>{t(lang, 'finalDetails')}</h2>
            <div className="hair-text-content" style={{ whiteSpace: 'pre-wrap' }}>{result.description}</div>
          </div>
        )}

        {result.message && (
          <div className="card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #667eea 100%)', color: 'white', textAlign: 'center' }}>
            <h2 style={{ color: 'white' }}>{t(lang, 'finalMessage')}</h2>
            <p style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>{result.message}</p>
          </div>
        )}

        <div className="cta-container">
          <button className="cta-btn" onClick={onBack}>
            {t(lang, 'backToHome')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <button className="back-btn" onClick={onBack}>{t(lang, 'back')}</button>
        <h1>{t(lang, 'finalTitle')}</h1>
        <p>{t(lang, 'finalSubtitle')}</p>
      </header>

      {error && <div className="error-msg">{error}</div>}

      <div className="card">
        <h2>{t(lang, 'selectedImages')}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {['skin', 'hair', 'diet', 'makeup', 'fashion'].map((key) => (
            <div key={key} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.5rem',
              borderRadius: '10px',
              background: selections[key] ? '#f0fdf4' : '#f9fafb',
              border: selections[key] ? '1px solid #bbf7d0' : '1px solid #e5e7eb',
            }}>
              <span style={{ fontSize: '1.3rem' }}>{STEP_ICONS[key]}</span>
              <span style={{ flex: 1, fontWeight: '500', color: selections[key] ? '#166534' : '#9ca3af' }}>
                {t(lang, `final_${key}`)}
              </span>
              {selections[key] ? (
                <span style={{ color: '#16a34a', fontWeight: '600', fontSize: '0.85rem' }}>✓ {t(lang, 'selected')}</span>
              ) : (
                <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>{t(lang, 'notSelected')}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedCount > 0 && selections.skin && (
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>
            {t(lang, 'finalReadyDesc')}
          </p>
        </div>
      )}

      <div className="cta-container">
        <button
          className="cta-btn"
          disabled={selectedCount === 0}
          onClick={handleGenerate}
        >
          {t(lang, 'generateFinal')}
        </button>
      </div>
    </div>
  )
}
