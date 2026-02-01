import { useState, useRef } from 'react'
import { t } from './i18n'

function downloadImage(base64, filename) {
  const link = document.createElement('a')
  link.href = `data:image/png;base64,${base64}`
  link.download = filename
  link.click()
}

export default function Fashion({ lang, onBack, onSelect, selected }) {
  const [photo, setPhoto] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [occasion, setOccasion] = useState('')
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
    if (!photoFile || !occasion.trim()) return
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('image', photoFile)
      formData.append('occasion', occasion)
      formData.append('lang', lang)

      const res = await fetch('/api/fashion', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to generate fashion recommendation')
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
    setOccasion('')
  }

  const quickOccasions = t(lang, 'quickOccasions')

  if (loading) {
    return (
      <div className="app loading-screen">
        <div className="loader" />
        <p className="loading-text">{t(lang, 'fashionLoading')}</p>
        <p className="loading-sub">{t(lang, 'fashionLoadingSub')}</p>
      </div>
    )
  }

  if (result) {
    return (
      <div className="app">
        <header className="header">
          <h1>{t(lang, 'fashionResultTitle')}</h1>
          <p>{result.occasion?.type}</p>
        </header>

        {result.fashionImage && (
          <div className="card hair-result-card">
            <h2>{t(lang, 'beforeAfter')}</h2>
            <img
              className="hair-result-image"
              src={`data:image/png;base64,${result.fashionImage}`}
              alt="Fashion before and after"
            />
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                className="download-btn"
                onClick={() => downloadImage(result.fashionImage, 'kfashion-styling.png')}
              >
                {t(lang, 'downloadImage')}
              </button>
              <button
                className={`download-btn ${selected ? 'selected-btn' : 'select-btn'}`}
                onClick={() => onSelect?.(result.fashionImage)}
              >
                {selected ? t(lang, 'selectedForFinal') : t(lang, 'selectForFinal')}
              </button>
            </div>
          </div>
        )}

        {result.currentAnalysis && (
          <div className="card">
            <h2>{t(lang, 'styleAnalysis')}</h2>
            <div className="nutrients" style={{ marginBottom: '0.75rem' }}>
              <div className="nutrient-tags">
                <span className="nutrient-tag">{result.currentAnalysis.bodyType}</span>
                <span className="nutrient-tag">{result.currentAnalysis.colorTone}</span>
              </div>
            </div>
            <p className="analysis-desc">{result.currentAnalysis.currentStyle}</p>
            <p className="meal-reason" style={{ marginTop: '0.5rem' }}>{result.currentAnalysis.strengths}</p>
          </div>
        )}

        {result.occasion && (
          <div className="card score-card">
            <div className="score-circle">
              <span className="score-value" style={{ fontSize: '0.85rem' }}>{result.occasion.dresscode}</span>
              <span className="score-label">{t(lang, 'dressCode')}</span>
            </div>
            <div className="score-circle">
              <span className="score-value" style={{ fontSize: '0.85rem' }}>{result.occasion.mood}</span>
              <span className="score-label">{t(lang, 'mood')}</span>
            </div>
          </div>
        )}

        {result.stylingGuide && (
          <div className="card">
            <h2>{t(lang, 'stylingGuide')}</h2>
            {result.stylingGuide.top && (
              <div className="meal-item">
                <span className="meal-type">Top</span>
                <div className="meal-detail">
                  <p className="meal-menu">{result.stylingGuide.top.item}</p>
                  <p className="meal-reason">{result.stylingGuide.top.reason}</p>
                </div>
              </div>
            )}
            {result.stylingGuide.bottom && (
              <div className="meal-item">
                <span className="meal-type">Bottom</span>
                <div className="meal-detail">
                  <p className="meal-menu">{result.stylingGuide.bottom.item}</p>
                  <p className="meal-reason">{result.stylingGuide.bottom.reason}</p>
                </div>
              </div>
            )}
            {result.stylingGuide.outer && (
              <div className="meal-item">
                <span className="meal-type">Outer</span>
                <div className="meal-detail">
                  <p className="meal-menu">{result.stylingGuide.outer.item}</p>
                  <p className="meal-reason">{result.stylingGuide.outer.reason}</p>
                </div>
              </div>
            )}
            {result.stylingGuide.shoes && (
              <div className="meal-item">
                <span className="meal-type">Shoes</span>
                <div className="meal-detail">
                  <p className="meal-menu">{result.stylingGuide.shoes.item}</p>
                  <p className="meal-reason">{result.stylingGuide.shoes.reason}</p>
                </div>
              </div>
            )}
            {result.stylingGuide.accessories && (
              <div className="meal-item">
                <span className="meal-type">ACC</span>
                <div className="meal-detail">
                  <p className="meal-menu">{result.stylingGuide.accessories.items?.join(' / ')}</p>
                  <p className="meal-reason">{result.stylingGuide.accessories.reason}</p>
                </div>
              </div>
            )}
            {result.stylingGuide.overallTip && (
              <p className="meal-reason" style={{ marginTop: '0.75rem', fontStyle: 'italic' }}>{result.stylingGuide.overallTip}</p>
            )}
          </div>
        )}

        {result.colorPalette && (
          <div className="card">
            <h2>{t(lang, 'colorPalette')}</h2>
            <div className="meal-item">
              <span className="meal-type">Main</span>
              <div className="meal-detail"><p className="meal-menu">{result.colorPalette.main}</p></div>
            </div>
            <div className="meal-item">
              <span className="meal-type">Accent</span>
              <div className="meal-detail"><p className="meal-menu">{result.colorPalette.accent}</p></div>
            </div>
            <div className="meal-item">
              <span className="meal-type">Avoid</span>
              <div className="meal-detail"><p className="meal-menu">{result.colorPalette.avoid}</p></div>
            </div>
          </div>
        )}

        {result.alternativeLooks?.length > 0 && (
          <div className="card">
            <h2>{t(lang, 'alternativeLooks')}</h2>
            {result.alternativeLooks.map((look, i) => (
              <div className="meal-item" key={i} style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                <span className="meal-type">{look.name}</span>
                <div className="meal-detail">
                  <p className="meal-menu">{look.description}</p>
                  <p className="meal-reason">{look.vibe}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {result.brandRecommendations?.length > 0 && (
          <div className="card">
            <h2>{t(lang, 'brandPicks')}</h2>
            {result.brandRecommendations.map((brand, i) => (
              <div className="meal-item" key={i}>
                <span className="meal-type" style={{ fontSize: '0.8rem' }}>{brand.brand}</span>
                <div className="meal-detail">
                  <p className="meal-menu">{brand.item} ({brand.priceRange})</p>
                  <p className="meal-reason">{brand.reason}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {result.fashionDonts?.length > 0 && (
          <div className="card" style={{ background: '#fff5f5' }}>
            <h2>{t(lang, 'fashionDonts')}</h2>
            <ul className="recommendations">
              {result.fashionDonts.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {result.proTip && (
          <div className="card" style={{ background: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', color: 'white', textAlign: 'center' }}>
            <h2 style={{ color: 'white' }}>{t(lang, 'stylistTip')}</h2>
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
        <h1>{t(lang, 'fashionTitle')}</h1>
        <p>{t(lang, 'fashionSubtitle')}</p>
      </header>

      {error && <div className="error-msg">{error}</div>}

      <div className="card">
        <h2>{t(lang, 'fullBodyPhoto')}</h2>
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
              <div className="face-guide-oval" style={{ width: '35%', height: '85%', borderRadius: '15px' }}>
                <span className="face-guide-text">{t(lang, 'bodyGuide')}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h2>{t(lang, 'occasionTitle')}</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
          {quickOccasions.map((item) => (
            <button
              key={item}
              onClick={() => setOccasion(item)}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '20px',
                border: occasion === item ? '2px solid #7c3aed' : '1px solid #ddd',
                background: occasion === item ? '#f3e8ff' : 'white',
                color: occasion === item ? '#7c3aed' : '#666',
                fontSize: '0.85rem',
                cursor: 'pointer',
                fontWeight: occasion === item ? '600' : '400',
              }}
            >
              {item}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder={t(lang, 'occasionPlaceholder')}
          value={occasion}
          onChange={(e) => setOccasion(e.target.value)}
          style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #ddd', fontSize: '1rem', boxSizing: 'border-box' }}
        />
      </div>

      <div className="cta-container">
        <button className="cta-btn" disabled={!photoFile || !occasion.trim()} onClick={handleSubmit}>
          {t(lang, 'getMyStyle')}
        </button>
      </div>
    </div>
  )
}
