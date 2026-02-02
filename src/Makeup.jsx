import { useState, useRef } from 'react'
import { t } from './i18n'

async function handleShare(lang, result, tFn) {
  const title = 'K-Beauty Makeup Report'
  const text = `${title}\n${result.skinToneAnalysis?.undertone || ''} / ${result.skinToneAnalysis?.season || ''}`

  let file = null
  if (result.makeupImage) {
    try {
      const res = await fetch(`data:image/png;base64,${result.makeupImage}`)
      const blob = await res.blob()
      file = new File([blob], 'k-beauty-makeup.png', { type: 'image/png' })
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

const MAKEUP_STYLES = [
  { id: 'glow-natural', icon: 'dew_point', labelKey: 'mkStyleGlow', descKey: 'mkStyleGlowDesc' },
  { id: 'cool-pure', icon: 'ac_unit', labelKey: 'mkStyleCool', descKey: 'mkStyleCoolDesc' },
  { id: 'warm-coral', icon: 'local_fire_department', labelKey: 'mkStyleCoral', descKey: 'mkStyleCoralDesc' },
  { id: 'smoky-chic', icon: 'nights_stay', labelKey: 'mkStyleSmoky', descKey: 'mkStyleSmokyDesc' },
  { id: 'rose-glam', icon: 'spa', labelKey: 'mkStyleRose', descKey: 'mkStyleRoseDesc' },
  { id: 'dewy-glass', icon: 'water_drop', labelKey: 'mkStyleDewy', descKey: 'mkStyleDewyDesc' },
  { id: 'retro-mood', icon: 'filter_vintage', labelKey: 'mkStyleRetro', descKey: 'mkStyleRetroDesc' },
  { id: 'y2k-pop', icon: 'star', labelKey: 'mkStyleY2K', descKey: 'mkStyleY2KDesc' },
  { id: 'wedding-elegance', icon: 'diamond', labelKey: 'mkStyleWedding', descKey: 'mkStyleWeddingDesc' },
]

export default function Makeup({ lang, onBack, onSelect, selected }) {
  const [photo, setPhoto] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [selectedStyle, setSelectedStyle] = useState(null)
  const [customDesc, setCustomDesc] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
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
    if (!photoFile || !selectedStyle) return
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('image', photoFile)
      formData.append('styleId', selectedStyle)
      formData.append('customDesc', customDesc)
      formData.append('lang', lang)

      const res = await fetch('/api/makeup', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to generate makeup')
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
    setSelectedStyle(null)
    setCustomDesc('')
  }

  // Loading
  if (loading) {
    return (
      <div className="clinic-page">
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <div className="loader" />
          <p style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 500, fontSize: '1rem', color: '#2D3436' }}>{t(lang, 'makeupLoading')}</p>
          <p style={{ fontSize: '13px', color: 'rgba(45,52,54,0.6)' }}>{t(lang, 'makeupLoadingSub')}</p>
        </div>
      </div>
    )
  }

  // Result
  if (result) {
    return (
      <div className="clinic-page">
        <header className="clinic-header">
          <div className="clinic-header-back" onClick={handleReset}>
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </div>
          <h1 className="clinic-header-title">{t(lang, 'makeupResultTitle')}</h1>
          <div className="clinic-header-menu">
            {result.makeupImage && (
              <button className="clinic-icon-btn" onClick={() => downloadImage(result.makeupImage, 'k-beauty-makeup.png')}>
                <span className="material-symbols-outlined">download</span>
              </button>
            )}
          </div>
        </header>

        <main className="clinic-main">
          <div className="clinic-section" style={{ paddingTop: 24 }}>
            <div className="clinic-report-header">
              <div>
                <span className="clinic-label">K-Beauty Report</span>
                <span className="clinic-scan-title">{t(lang, 'makeupResultSub')}</span>
              </div>
              <div className="clinic-ai-badge">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>auto_awesome</span>
                <span>AI Makeup</span>
              </div>
            </div>

            {result.makeupImage ? (
              <>
                <div style={{ borderRadius: '1rem', overflow: 'hidden', border: '1px solid rgba(253,226,228,0.5)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                  <img
                    src={`data:image/png;base64,${result.makeupImage}`}
                    alt="K-Beauty makeup result"
                    style={{ width: '100%', display: 'block' }}
                  />
                </div>
                <div className="cr-action-row">
                  <button className="cr-action-btn" onClick={() => downloadImage(result.makeupImage, 'k-beauty-makeup.png')}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
                    {t(lang, 'downloadImage')}
                  </button>
                  <button
                    className={`cr-action-btn ${selected ? 'cr-action-btn-selected' : 'cr-action-btn-select'}`}
                    onClick={() => onSelect?.(result.makeupImage)}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{selected ? 'check_circle' : 'add_circle_outline'}</span>
                    {selected ? t(lang, 'selectedForFinal') : t(lang, 'selectForFinal')}
                  </button>
                </div>
              </>
            ) : (
              <div style={{ borderRadius: '1rem', padding: '24px', background: 'rgba(45,52,54,0.03)', textAlign: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'rgba(229,152,155,0.5)', display: 'block', marginBottom: 8 }}>image_not_supported</span>
                <p style={{ fontSize: '13px', color: 'rgba(45,52,54,0.5)' }}>{t(lang, 'mkImageFailed')}</p>
              </div>
            )}
          </div>

          {/* Skin Tone Analysis */}
          {result.skinToneAnalysis && (
            <div className="clinic-section">
              <div className="clinic-card">
                <div className="clinic-card-header">
                  <div className="clinic-card-icon">
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>palette</span>
                  </div>
                  <h2 className="clinic-card-title">{t(lang, 'mkSkinTone')}</h2>
                </div>
                <div className="clinic-routines">
                  <div className="clinic-routine">
                    <h3 className="clinic-routine-label">{t(lang, 'undertone')}</h3>
                    <p className="clinic-routine-text"><strong>{result.skinToneAnalysis.undertone}</strong></p>
                  </div>
                  <div className="clinic-routine clinic-routine-border">
                    <h3 className="clinic-routine-label">{t(lang, 'season')}</h3>
                    <p className="clinic-routine-text"><strong>{result.skinToneAnalysis.season}</strong></p>
                  </div>
                  <div className="clinic-routine clinic-routine-border">
                    <p className="clinic-routine-text">{result.skinToneAnalysis.description}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Makeup Guide */}
          {result.makeupGuide && (
            <div className="clinic-section">
              <div className="clinic-card">
                <div className="clinic-card-header">
                  <div className="clinic-card-icon">
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>brush</span>
                  </div>
                  <h2 className="clinic-card-title">{t(lang, 'mkGuide')}</h2>
                </div>
                <div className="clinic-routines">
                  {result.makeupGuide.base && (
                    <div className="clinic-routine">
                      <h3 className="clinic-routine-label">{t(lang, 'baseMakeup')}</h3>
                      <p className="clinic-routine-text">{result.makeupGuide.base.foundation}</p>
                      <p className="clinic-routine-text" style={{ color: 'rgba(45,52,54,0.6)', marginTop: 2 }}>{result.makeupGuide.base.tip}</p>
                    </div>
                  )}
                  {result.makeupGuide.eye && (
                    <div className="clinic-routine clinic-routine-border">
                      <h3 className="clinic-routine-label">{t(lang, 'eyeMakeup')}</h3>
                      <p className="clinic-routine-text">{result.makeupGuide.eye.eyeshadow}</p>
                      <p className="clinic-routine-text" style={{ color: 'rgba(45,52,54,0.6)', marginTop: 2 }}>{result.makeupGuide.eye.tip}</p>
                    </div>
                  )}
                  {result.makeupGuide.lip && (
                    <div className="clinic-routine clinic-routine-border">
                      <h3 className="clinic-routine-label">{t(lang, 'lipMakeup')}</h3>
                      <p className="clinic-routine-text">{result.makeupGuide.lip.color}</p>
                      <p className="clinic-routine-text" style={{ color: 'rgba(45,52,54,0.6)', marginTop: 2 }}>{result.makeupGuide.lip.tip}</p>
                    </div>
                  )}
                  {result.makeupGuide.cheek && (
                    <div className="clinic-routine clinic-routine-border">
                      <h3 className="clinic-routine-label">{t(lang, 'cheekMakeup')}</h3>
                      <p className="clinic-routine-text">{result.makeupGuide.cheek.blush}</p>
                      <p className="clinic-routine-text" style={{ color: 'rgba(45,52,54,0.6)', marginTop: 2 }}>{result.makeupGuide.cheek.tip}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Product Recommendations */}
          {result.productRecommendations?.length > 0 && (
            <div className="clinic-section">
              <div className="clinic-card">
                <div className="clinic-card-header">
                  <div className="clinic-card-icon">
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>shopping_bag</span>
                  </div>
                  <h2 className="clinic-card-title">{t(lang, 'productPicks')}</h2>
                </div>
                <div className="clinic-routines">
                  {result.productRecommendations.map((prod, i) => (
                    <div key={i} className={`clinic-routine ${i > 0 ? 'clinic-routine-border' : ''}`}>
                      <h3 className="clinic-routine-label">{prod.category}</h3>
                      <p className="clinic-routine-text"><strong>{prod.brand}</strong> — {prod.product}</p>
                      <p className="clinic-routine-text" style={{ color: 'rgba(45,52,54,0.6)', marginTop: 2 }}>{prod.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Pro Tip */}
          {result.proTip && (
            <div className="clinic-section">
              <div className="clinic-card" style={{ background: 'linear-gradient(135deg, rgba(229,152,155,0.1), rgba(253,226,228,0.3))' }}>
                <div className="clinic-card-header">
                  <div className="clinic-card-icon">
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>tips_and_updates</span>
                  </div>
                  <h2 className="clinic-card-title">{t(lang, 'proTip')}</h2>
                </div>
                <p style={{ fontSize: '13px', lineHeight: 1.7, color: 'rgba(45,52,54,0.8)' }}>{result.proTip}</p>
              </div>
            </div>
          )}

          {/* Try Again */}
          <div className="clinic-section">
            <button className="clinic-start-btn" onClick={handleReset} style={{ width: '100%' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>refresh</span>
              <span>{t(lang, 'tryAgain')}</span>
            </button>
          </div>
          <div style={{ height: 80 }} />
        </main>

        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 50 }}>
          <button className="clinic-share-btn" onClick={async () => {
            const status = await handleShare(lang, result, t)
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

  // Input screen
  return (
    <div className="clinic-page">
      <header className="clinic-header">
        <div className="clinic-header-back" onClick={onBack}>
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </div>
        <h1 className="clinic-header-title">{t(lang, 'makeupTitle')}</h1>
        <div className="clinic-header-menu">
          <button className="clinic-icon-btn">
            <span className="material-symbols-outlined">more_horiz</span>
          </button>
        </div>
      </header>

      <main className="clinic-main">
        {/* Photo upload */}
        <div className="clinic-section" style={{ paddingTop: 24 }}>
          <div className="clinic-report-header">
            <div>
              <span className="clinic-label">K-Beauty Clinic</span>
              <span className="clinic-scan-title">{t(lang, 'makeupSubtitle')}</span>
            </div>
            <div className="clinic-ai-badge">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>face_retouching_natural</span>
              <span>AI Artist</span>
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
                  backgroundImage: 'url("/makeup-target.png")',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  width: '100%',
                  height: '100%',
                }}
              />
              <div className="clinic-photo-tag clinic-photo-tag-pink">K-Beauty</div>
              <div className="clinic-photo-flare">
                <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#fff' }}>auto_awesome</span>
              </div>
            </div>
          </div>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={handlePhoto} />
          <input ref={galleryRef} type="file" accept="image/*" hidden onChange={handlePhoto} />
        </div>

        {error && <div className="clinic-section"><div className="error-msg">{error}</div></div>}

        {/* Style Selection */}
        <section className="clinic-section">
          <div className="clinic-card">
            <div className="clinic-card-header">
              <div className="clinic-card-icon">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>face_retouching_natural</span>
              </div>
              <h2 className="clinic-card-title">{t(lang, 'mkSelectStyle')}</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {MAKEUP_STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  style={{
                    padding: '12px 4px 10px',
                    borderRadius: '12px',
                    border: selectedStyle === style.id ? '2px solid #E5989B' : '2px solid rgba(45,52,54,0.08)',
                    background: selectedStyle === style.id ? 'rgba(229,152,155,0.1)' : 'rgba(45,52,54,0.02)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: 22,
                      color: selectedStyle === style.id ? '#E5989B' : 'rgba(45,52,54,0.5)',
                    }}
                  >
                    {style.icon}
                  </span>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: selectedStyle === style.id ? 600 : 400,
                    color: selectedStyle === style.id ? '#E5989B' : '#2D3436',
                    lineHeight: 1.2,
                  }}>
                    {t(lang, style.labelKey)}
                  </span>
                  <span style={{
                    fontSize: '0.62rem',
                    color: 'rgba(45,52,54,0.5)',
                    lineHeight: 1.2,
                  }}>
                    {t(lang, style.descKey)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Custom Description */}
        <section className="clinic-section">
          <div className="clinic-card">
            <div className="clinic-card-header">
              <div className="clinic-card-icon">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit_note</span>
              </div>
              <h2 className="clinic-card-title">{t(lang, 'mkCustomDesc')}</h2>
            </div>
            <textarea
              placeholder={t(lang, 'mkCustomDescPlaceholder')}
              value={customDesc}
              onChange={(e) => setCustomDesc(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid rgba(45,52,54,0.12)',
                fontSize: '0.9rem',
                boxSizing: 'border-box',
                background: 'rgba(45,52,54,0.03)',
                resize: 'vertical',
                fontFamily: 'inherit',
                lineHeight: 1.5,
              }}
            />
          </div>
        </section>
      </main>

      <div className="clinic-bottom-cta">
        <div className="clinic-bottom-inner">
          <button className="clinic-start-btn" disabled={!photoFile || !selectedStyle} onClick={handleSubmit}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>face_retouching_natural</span>
            <span>{t(lang, 'mkStartMakeup')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
