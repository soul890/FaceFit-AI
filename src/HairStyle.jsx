import { useState, useRef } from 'react'
import { t } from './i18n'

async function handleShare(lang, resultImage, analysis, tFn) {
  const title = 'Hair Styling Report'
  const text = `${title}\n${analysis?.faceAnalysis?.faceShape || ''}`

  let file = null
  if (resultImage) {
    try {
      const res = await fetch(`data:image/png;base64,${resultImage}`)
      const blob = await res.blob()
      file = new File([blob], 'hairstyle-recommendation.png', { type: 'image/png' })
    } catch {}
  }

  if (navigator.share) {
    try {
      const shareData = { title, text }
      if (file && navigator.canShare?.({ files: [file] })) shareData.files = [file]
      await navigator.share(shareData)
      return 'shared'
    } catch (e) {
      if (e.name === 'AbortError') return null
    }
  }

  try {
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch {
    return null
  }
}

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
  const [analysis, setAnalysis] = useState(null)
  const [error, setError] = useState(null)
  const [shareMsg, setShareMsg] = useState(null)
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
      setAnalysis(data.analysis)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setResultImage(null)
    setResultText(null)
    setAnalysis(null)
    setError(null)
    setPhoto(null)
    setPhotoFile(null)
  }

  if (loading) {
    return (
      <div className="clinic-page">
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <div className="loader" />
          <p style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 500, fontSize: '1rem', color: '#2D3436' }}>{t(lang, 'hairLoading')}</p>
          <p style={{ fontSize: '13px', color: 'rgba(45,52,54,0.6)' }}>{t(lang, 'hairLoadingSub')}</p>
        </div>
      </div>
    )
  }

  if (resultImage) {
    return (
      <div className="clinic-page">
        <header className="clinic-header">
          <div className="clinic-header-back" onClick={handleReset}>
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </div>
          <h1 className="clinic-header-title">{t(lang, 'hairResult')}</h1>
          <div className="clinic-header-menu">
            <button className="clinic-icon-btn" onClick={() => downloadImage(resultImage, 'hairstyle-recommendation.png')}>
              <span className="material-symbols-outlined">download</span>
            </button>
          </div>
        </header>

        <main className="clinic-main">
          <div className="clinic-section" style={{ paddingTop: 24 }}>
            <div className="clinic-report-header">
              <div>
                <span className="clinic-label">Hair Styling Report</span>
                <span className="clinic-scan-title">{t(lang, 'hairResultSub')}</span>
              </div>
              <div className="clinic-ai-badge">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>auto_awesome</span>
                <span>AI Styled</span>
              </div>
            </div>

            <div style={{ borderRadius: '1rem', overflow: 'hidden', border: '1px solid rgba(253,226,228,0.5)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <img
                src={`data:image/png;base64,${resultImage}`}
                alt="Hairstyle recommendations"
                style={{ width: '100%', display: 'block' }}
              />
            </div>

            <div className="cr-action-row">
              <button className="cr-action-btn" onClick={() => downloadImage(resultImage, 'hairstyle-recommendation.png')}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
                {t(lang, 'downloadImage')}
              </button>
              <button
                className={`cr-action-btn ${selected ? 'cr-action-btn-selected' : 'cr-action-btn-select'}`}
                onClick={() => onSelect?.(resultImage)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{selected ? 'check_circle' : 'add_circle_outline'}</span>
                {selected ? t(lang, 'selectedForFinal') : t(lang, 'selectForFinal')}
              </button>
            </div>
          </div>

          {analysis && analysis.faceAnalysis && (
            <div className="clinic-section">
              <div className="clinic-card">
                <div className="clinic-card-header">
                  <div className="clinic-card-icon">
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>face</span>
                  </div>
                  <h2 className="clinic-card-title">{t(lang, 'faceAnalysis')}</h2>
                </div>
                <div className="clinic-routines">
                  <div className="clinic-routine">
                    <h3 className="clinic-routine-label">{t(lang, 'faceShape')}</h3>
                    <p className="clinic-routine-text"><strong>{analysis.faceAnalysis.faceShape}</strong></p>
                  </div>
                  <div className="clinic-routine clinic-routine-border">
                    <h3 className="clinic-routine-label">{t(lang, 'features')}</h3>
                    <p className="clinic-routine-text">{analysis.faceAnalysis.features}</p>
                  </div>
                  <div className="clinic-routine clinic-routine-border">
                    <h3 className="clinic-routine-label">{t(lang, 'skinTone')}</h3>
                    <p className="clinic-routine-text">{analysis.faceAnalysis.skinTone}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {analysis && analysis.styles && analysis.styles.length > 0 && (
            <div className="clinic-section">
              <div className="clinic-card">
                <div className="clinic-card-header">
                  <div className="clinic-card-icon">
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>content_cut</span>
                  </div>
                  <h2 className="clinic-card-title">{t(lang, 'styleDetails')}</h2>
                </div>
                <div className="clinic-routines">
                  {analysis.styles.map((style, i) => (
                    <div key={i} className={`clinic-routine ${i > 0 ? 'clinic-routine-border' : ''}`}>
                      <h3 className="clinic-routine-label">Style {i + 1}</h3>
                      <p className="clinic-routine-text" style={{ marginBottom: 4 }}>
                        <strong>{style.name}</strong>
                      </p>
                      <p className="clinic-routine-text">{style.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!analysis && resultText && (
            <div className="clinic-section">
              <div className="clinic-card">
                <div className="clinic-card-header">
                  <div className="clinic-card-icon">
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>content_cut</span>
                  </div>
                  <h2 className="clinic-card-title">{t(lang, 'styleDetails')}</h2>
                </div>
                <p style={{ fontSize: '13px', lineHeight: 1.7, color: 'rgba(45,52,54,0.8)', whiteSpace: 'pre-wrap' }}>{resultText}</p>
              </div>
            </div>
          )}

          <div className="clinic-section">
            <button
              className="clinic-start-btn"
              onClick={handleReset}
              style={{ width: '100%' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>refresh</span>
              <span>{t(lang, 'tryAgain')}</span>
            </button>
          </div>
          <div style={{ height: 80 }} />
        </main>

        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 50 }}>
          <button className="clinic-share-btn" onClick={async () => {
            const status = await handleShare(lang, resultImage, analysis, t)
            if (status === 'copied') {
              setShareMsg(t(lang, 'copiedToClipboard'))
              setTimeout(() => setShareMsg(null), 2000)
            }
          }} style={{ position: 'relative', boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>share</span>
            {shareMsg && (
              <span style={{
                position: 'absolute', bottom: '110%', right: 0, background: '#333', color: '#fff',
                fontSize: 12, padding: '4px 10px', borderRadius: 8, whiteSpace: 'nowrap'
              }}>{shareMsg}</span>
            )}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="clinic-page">
      <header className="clinic-header">
        <div className="clinic-header-back" onClick={onBack}>
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </div>
        <h1 className="clinic-header-title">{t(lang, 'hairTitle')}</h1>
        <div className="clinic-header-menu">
          <button className="clinic-icon-btn">
            <span className="material-symbols-outlined">more_horiz</span>
          </button>
        </div>
      </header>

      <main className="clinic-main">
        <div className="clinic-section" style={{ paddingTop: 24 }}>
          <div className="clinic-report-header">
            <div>
              <span className="clinic-label">Hair Clinic</span>
              <span className="clinic-scan-title">{t(lang, 'hairSubtitle')}</span>
            </div>
            <div className="clinic-ai-badge">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>content_cut</span>
              <span>AI Styling</span>
            </div>
          </div>

          <div className="clinic-photo-grid">
            <div className="clinic-photo-card" onClick={() => cameraRef.current?.click()}>
              {photo ? (
                <img src={photo} alt="Your photo" className="clinic-photo-img" />
              ) : (
                <div className="clinic-photo-placeholder">
                  <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'rgba(229,152,155,0.5)' }}>add_a_photo</span>
                </div>
              )}
              <div className="clinic-photo-tag clinic-photo-tag-dark">Your Photo</div>
            </div>
            <div className="clinic-photo-card clinic-photo-target">
              <div
                className="clinic-photo-img"
                style={{
                  backgroundImage: 'url("https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=500&fit=crop&crop=face")',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  width: '100%',
                  height: '100%',
                }}
              />
              <div className="clinic-photo-tag clinic-photo-tag-pink">Style Target</div>
              <div className="clinic-photo-flare">
                <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#fff' }}>auto_awesome</span>
              </div>
            </div>
          </div>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={handlePhoto} />
          <input ref={galleryRef} type="file" accept="image/*" hidden onChange={handlePhoto} />
        </div>

        {error && <div className="clinic-section"><div className="error-msg">{error}</div></div>}

        <section className="clinic-section">
          <div className="clinic-card">
            <div className="clinic-card-header">
              <div className="clinic-card-icon">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>content_cut</span>
              </div>
              <h2 className="clinic-card-title">Hair Style Guide</h2>
            </div>
            <div className="clinic-routines">
              <div className="clinic-routine">
                <h3 className="clinic-routine-label">How it works</h3>
                <p className="clinic-routine-text">
                  Upload your photo and our <strong>AI Hair Stylist</strong> will generate 9 personalized hairstyle recommendations in a 3x3 grid.
                </p>
              </div>
              <div className="clinic-routine clinic-routine-border">
                <h3 className="clinic-routine-label">Best Results</h3>
                <p className="clinic-routine-text">
                  Use a <strong>front-facing photo</strong> with clear lighting. Hair pulled back slightly works best for accurate styling.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <div className="clinic-bottom-cta">
        <div className="clinic-bottom-inner">
          <button className="clinic-start-btn" disabled={!photoFile} onClick={handleSubmit}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>content_cut</span>
            <span>{t(lang, 'getRecommendations')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
