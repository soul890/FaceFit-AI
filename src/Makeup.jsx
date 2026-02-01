import { useState, useRef } from 'react'
import { t } from './i18n'

function downloadImage(base64, filename) {
  const link = document.createElement('a')
  link.href = `data:image/png;base64,${base64}`
  link.download = filename
  link.click()
}

export default function Makeup({ lang, onBack, onSelect, selected }) {
  const [photo, setPhoto] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
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

      const res = await fetch('/api/makeup', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to generate makeup recommendation')
      }

      const data = await res.json()
      setResult(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setError(null)
    setPhoto(null)
    setPhotoFile(null)
  }

  if (loading) {
    return (
      <div className="app loading-screen">
        <div className="loader" />
        <p className="loading-text">{t(lang, 'makeupLoading')}</p>
        <p className="loading-sub">{t(lang, 'makeupLoadingSub')}</p>
      </div>
    )
  }

  if (result) {
    return (
      <div className="app">
        <header className="header">
          <h1>{t(lang, 'makeupResultTitle')}</h1>
          <p>{t(lang, 'makeupResultSub')}</p>
        </header>

        {result.makeupImage && (
          <div className="card hair-result-card">
            <h2>{t(lang, 'beforeAfter')}</h2>
            <img
              className="hair-result-image"
              src={`data:image/png;base64,${result.makeupImage}`}
              alt="Makeup before and after"
            />
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                className="download-btn"
                onClick={() => downloadImage(result.makeupImage, 'kbeauty-makeup.png')}
              >
                {t(lang, 'downloadImage')}
              </button>
              <button
                className={`download-btn ${selected ? 'selected-btn' : 'select-btn'}`}
                onClick={() => onSelect?.(result.makeupImage)}
              >
                {selected ? t(lang, 'selectedForFinal') : t(lang, 'selectForFinal')}
              </button>
            </div>
          </div>
        )}

        {result.skinToneAnalysis && (
          <div className="card score-card">
            <div className="score-circle">
              <span className="score-value" style={{ fontSize: '0.9rem' }}>{result.skinToneAnalysis.undertone}</span>
              <span className="score-label">{t(lang, 'undertone')}</span>
            </div>
            <div className="score-circle">
              <span className="score-value" style={{ fontSize: '0.8rem' }}>{result.skinToneAnalysis.season}</span>
              <span className="score-label">{t(lang, 'season')}</span>
            </div>
            <p className="analysis-desc">{result.skinToneAnalysis.description}</p>
          </div>
        )}

        {result.faceAnalysis && (
          <div className="card">
            <h2>{t(lang, 'faceAnalysis')}</h2>
            <div className="nutrients" style={{ marginBottom: '0.75rem' }}>
              <div className="nutrient-tags">
                <span className="nutrient-tag">{result.faceAnalysis.faceShape}</span>
                <span className="nutrient-tag">{result.faceAnalysis.eyeShape}</span>
                <span className="nutrient-tag">{result.faceAnalysis.lipShape}</span>
              </div>
            </div>
            <p className="analysis-desc">{result.faceAnalysis.strengths}</p>
          </div>
        )}

        {result.makeupGuide && (
          <>
            {result.makeupGuide.base && (
              <div className="card">
                <h2>{t(lang, 'baseMakeup')}</h2>
                <div className="meal-item"><span className="meal-type">Foundation</span><div className="meal-detail"><p className="meal-menu">{result.makeupGuide.base.foundation}</p></div></div>
                <div className="meal-item"><span className="meal-type">Primer</span><div className="meal-detail"><p className="meal-menu">{result.makeupGuide.base.primer}</p></div></div>
                <div className="meal-item"><span className="meal-type">Concealer</span><div className="meal-detail"><p className="meal-menu">{result.makeupGuide.base.concealer}</p></div></div>
                <div className="meal-item"><span className="meal-type">Setting</span><div className="meal-detail"><p className="meal-menu">{result.makeupGuide.base.setting}</p></div></div>
                <p className="meal-reason" style={{ marginTop: '0.5rem' }}>{result.makeupGuide.base.tip}</p>
              </div>
            )}

            {result.makeupGuide.eye && (
              <div className="card">
                <h2>{t(lang, 'eyeMakeup')}</h2>
                <div className="meal-item"><span className="meal-type">Shadow</span><div className="meal-detail"><p className="meal-menu">{result.makeupGuide.eye.eyeshadow}</p></div></div>
                <div className="meal-item"><span className="meal-type">Liner</span><div className="meal-detail"><p className="meal-menu">{result.makeupGuide.eye.eyeliner}</p></div></div>
                <div className="meal-item"><span className="meal-type">Mascara</span><div className="meal-detail"><p className="meal-menu">{result.makeupGuide.eye.mascara}</p></div></div>
                <div className="meal-item"><span className="meal-type">Brow</span><div className="meal-detail"><p className="meal-menu">{result.makeupGuide.eye.eyebrow}</p></div></div>
                <p className="meal-reason" style={{ marginTop: '0.5rem' }}>{result.makeupGuide.eye.tip}</p>
              </div>
            )}

            {result.makeupGuide.lip && (
              <div className="card">
                <h2>{t(lang, 'lipMakeup')}</h2>
                <div className="meal-item"><span className="meal-type">Color</span><div className="meal-detail"><p className="meal-menu">{result.makeupGuide.lip.color}</p></div></div>
                <div className="meal-item"><span className="meal-type">Technique</span><div className="meal-detail"><p className="meal-menu">{result.makeupGuide.lip.technique}</p></div></div>
                <div className="meal-item"><span className="meal-type">Product</span><div className="meal-detail"><p className="meal-menu">{result.makeupGuide.lip.product}</p></div></div>
                <p className="meal-reason" style={{ marginTop: '0.5rem' }}>{result.makeupGuide.lip.tip}</p>
              </div>
            )}

            {result.makeupGuide.cheek && (
              <div className="card">
                <h2>{t(lang, 'cheekMakeup')}</h2>
                <div className="meal-item"><span className="meal-type">Blush</span><div className="meal-detail"><p className="meal-menu">{result.makeupGuide.cheek.blush}</p></div></div>
                <div className="meal-item"><span className="meal-type">Contour</span><div className="meal-detail"><p className="meal-menu">{result.makeupGuide.cheek.contour}</p></div></div>
                <div className="meal-item"><span className="meal-type">Highlight</span><div className="meal-detail"><p className="meal-menu">{result.makeupGuide.cheek.highlight}</p></div></div>
                <p className="meal-reason" style={{ marginTop: '0.5rem' }}>{result.makeupGuide.cheek.tip}</p>
              </div>
            )}
          </>
        )}

        {result.looks?.length > 0 && (
          <div className="card">
            <h2>{t(lang, 'recommendedLooks')}</h2>
            {result.looks.map((look, i) => (
              <div className="meal-item" key={i} style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                <span className="meal-type">{look.name}</span>
                <div className="meal-detail">
                  <p className="meal-menu">{look.description}</p>
                  <p className="meal-reason">{look.occasion}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {result.productRecommendations?.length > 0 && (
          <div className="card">
            <h2>{t(lang, 'productPicks')}</h2>
            {result.productRecommendations.map((prod, i) => (
              <div className="meal-item" key={i}>
                <span className="meal-type" style={{ fontSize: '0.8rem' }}>{prod.category}</span>
                <div className="meal-detail">
                  <p className="meal-menu">{prod.brand} — {prod.product}</p>
                  <p className="meal-reason">{prod.reason}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {result.proTip && (
          <div className="card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white', textAlign: 'center' }}>
            <h2 style={{ color: 'white' }}>{t(lang, 'proTip')}</h2>
            <p style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>{result.proTip}</p>
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
        <h1>{t(lang, 'makeupTitle')}</h1>
        <p>{t(lang, 'makeupSubtitle')}</p>
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
          {t(lang, 'getMyLook')}
        </button>
      </div>
    </div>
  )
}
