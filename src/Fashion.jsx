import { useState, useRef } from 'react'
import { t } from './i18n'

async function handleShare(lang, result, tFn) {
  const title = 'K-Fashion Report'
  const text = `${title}\n${result.styleAnalysis?.bodyFit || ''}`

  let file = null
  if (result.fashionImage) {
    try {
      const res = await fetch(`data:image/png;base64,${result.fashionImage}`)
      const blob = await res.blob()
      file = new File([blob], 'k-fashion.png', { type: 'image/png' })
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

export default function Fashion({ lang, onBack, onSelect, selected }) {
  const [photo, setPhoto] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [mode, setMode] = useState('ai') // 'ai' or 'custom'
  const [occasion, setOccasion] = useState('')
  const [clothesTop, setClothesTop] = useState({ photo: null, file: null })
  const [clothesBottom, setClothesBottom] = useState({ photo: null, file: null })
  const [clothesOuter, setClothesOuter] = useState({ photo: null, file: null })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [shareMsg, setShareMsg] = useState(null)
  const cameraRef = useRef(null)
  const galleryRef = useRef(null)
  const clothesTopRef = useRef(null)
  const clothesBottomRef = useRef(null)
  const clothesOuterRef = useRef(null)

  const handlePhoto = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhoto(URL.createObjectURL(file))
      setPhotoFile(file)
    }
  }

  const handleClothesUpload = (setter) => (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setter({ photo: URL.createObjectURL(file), file })
    }
  }

  const quickOccasions = t(lang, 'quickOccasions')

  const canSubmit = photoFile && height && weight && (
    mode === 'ai' ? occasion.trim() : (clothesTop.file || clothesBottom.file || clothesOuter.file)
  )

  const handleSubmit = async () => {
    if (!canSubmit) return
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('image', photoFile)
      formData.append('height', height)
      formData.append('weight', weight)
      formData.append('mode', mode)
      formData.append('lang', lang)

      if (mode === 'ai') {
        formData.append('occasion', occasion)
      } else {
        if (clothesTop.file) formData.append('clothesTop', clothesTop.file)
        if (clothesBottom.file) formData.append('clothesBottom', clothesBottom.file)
        if (clothesOuter.file) formData.append('clothesOuter', clothesOuter.file)
      }

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
    setHeight('')
    setWeight('')
    setMode('ai')
    setOccasion('')
    setClothesTop({ photo: null, file: null })
    setClothesBottom({ photo: null, file: null })
    setClothesOuter({ photo: null, file: null })
  }

  // Loading
  if (loading) {
    return (
      <div className="clinic-page">
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <div className="loader" />
          <p style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 500, fontSize: '1rem', color: '#2D3436' }}>{t(lang, 'fashionLoading')}</p>
          <p style={{ fontSize: '13px', color: 'rgba(45,52,54,0.6)' }}>{t(lang, 'fashionLoadingSub')}</p>
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
          <h1 className="clinic-header-title">{t(lang, 'fashionResultTitle')}</h1>
          <div className="clinic-header-menu">
            {result.fashionImage && (
              <button className="clinic-icon-btn" onClick={() => downloadImage(result.fashionImage, 'k-fashion.png')}>
                <span className="material-symbols-outlined">download</span>
              </button>
            )}
          </div>
        </header>

        <main className="clinic-main">
          <div className="clinic-section" style={{ paddingTop: 24 }}>
            <div className="clinic-report-header">
              <div>
                <span className="clinic-label">K-Fashion Report</span>
                <span className="clinic-scan-title">{t(lang, 'fsnResultSub')}</span>
              </div>
              <div className="clinic-ai-badge">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>auto_awesome</span>
                <span>AI Stylist</span>
              </div>
            </div>

            {result.fashionImage ? (
              <>
                <div style={{ borderRadius: '1rem', overflow: 'hidden', border: '1px solid rgba(253,226,228,0.5)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                  <img
                    src={`data:image/png;base64,${result.fashionImage}`}
                    alt="K-Fashion styling"
                    style={{ width: '100%', display: 'block' }}
                  />
                </div>
                <div className="cr-action-row">
                  <button className="cr-action-btn" onClick={() => downloadImage(result.fashionImage, 'k-fashion.png')}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
                    {t(lang, 'downloadImage')}
                  </button>
                  <button
                    className={`cr-action-btn ${selected ? 'cr-action-btn-selected' : 'cr-action-btn-select'}`}
                    onClick={() => onSelect?.(result.fashionImage)}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{selected ? 'check_circle' : 'add_circle_outline'}</span>
                    {selected ? t(lang, 'selectedForFinal') : t(lang, 'selectForFinal')}
                  </button>
                </div>
              </>
            ) : (
              <div style={{ borderRadius: '1rem', padding: '24px', background: 'rgba(45,52,54,0.03)', textAlign: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'rgba(229,152,155,0.5)', display: 'block', marginBottom: 8 }}>image_not_supported</span>
                <p style={{ fontSize: '13px', color: 'rgba(45,52,54,0.5)' }}>{t(lang, 'fsnImageFailed')}</p>
              </div>
            )}
          </div>

          {/* Style Analysis Card */}
          {result.styleAnalysis && (
            <div className="clinic-section">
              <div className="clinic-card">
                <div className="clinic-card-header">
                  <div className="clinic-card-icon">
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>checkroom</span>
                  </div>
                  <h2 className="clinic-card-title">{t(lang, 'fsnStyleAnalysis')}</h2>
                </div>
                <div className="clinic-routines">
                  {result.styleAnalysis.bodyFit && (
                    <div className="clinic-routine">
                      <h3 className="clinic-routine-label">{t(lang, 'fsnBodyFit')}</h3>
                      <p className="clinic-routine-text">{result.styleAnalysis.bodyFit}</p>
                    </div>
                  )}
                  {result.styleAnalysis.colorMatch && (
                    <div className="clinic-routine clinic-routine-border">
                      <h3 className="clinic-routine-label">{t(lang, 'fsnColorMatch')}</h3>
                      <p className="clinic-routine-text">{result.styleAnalysis.colorMatch}</p>
                    </div>
                  )}
                  {result.styleAnalysis.silhouette && (
                    <div className="clinic-routine clinic-routine-border">
                      <h3 className="clinic-routine-label">{t(lang, 'fsnSilhouette')}</h3>
                      <p className="clinic-routine-text">{result.styleAnalysis.silhouette}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Coord Guide Card */}
          {result.coordGuide && (
            <div className="clinic-section">
              <div className="clinic-card">
                <div className="clinic-card-header">
                  <div className="clinic-card-icon">
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>styler</span>
                  </div>
                  <h2 className="clinic-card-title">{t(lang, 'fsnCoordGuide')}</h2>
                </div>
                <div className="clinic-routines">
                  {result.coordGuide.whyItWorks && (
                    <div className="clinic-routine">
                      <h3 className="clinic-routine-label">{t(lang, 'fsnWhyWorks')}</h3>
                      <p className="clinic-routine-text">{result.coordGuide.whyItWorks}</p>
                    </div>
                  )}
                  {result.coordGuide.stylingTip && (
                    <div className="clinic-routine clinic-routine-border">
                      <h3 className="clinic-routine-label">{t(lang, 'fsnStylingTip')}</h3>
                      <p className="clinic-routine-text">{result.coordGuide.stylingTip}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Recommended Accessories */}
          {result.accessories?.length > 0 && (
            <div className="clinic-section">
              <div className="clinic-card">
                <div className="clinic-card-header">
                  <div className="clinic-card-icon">
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>watch</span>
                  </div>
                  <h2 className="clinic-card-title">{t(lang, 'fsnAccessories')}</h2>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {result.accessories.map((acc, i) => (
                    <span key={i} className="clinic-nutrient-tag">{acc}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Cautions */}
          {result.cautions && (
            <div className="clinic-section">
              <div className="clinic-card" style={{ background: 'rgba(255,245,245,0.5)' }}>
                <div className="clinic-card-header">
                  <div className="clinic-card-icon">
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>warning</span>
                  </div>
                  <h2 className="clinic-card-title">{t(lang, 'fsnCautions')}</h2>
                </div>
                <p style={{ fontSize: '13px', lineHeight: 1.7, color: 'rgba(45,52,54,0.7)' }}>{result.cautions}</p>
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
        <h1 className="clinic-header-title">{t(lang, 'fashionTitle')}</h1>
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
              <span className="clinic-label">K-Fashion Clinic</span>
              <span className="clinic-scan-title">{t(lang, 'fashionSubtitle')}</span>
            </div>
            <div className="clinic-ai-badge">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>checkroom</span>
              <span>AI Stylist</span>
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
                  backgroundImage: 'url("https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=400&h=500&fit=crop")',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  width: '100%',
                  height: '100%',
                }}
              />
              <div className="clinic-photo-tag clinic-photo-tag-pink">K-Fashion</div>
              <div className="clinic-photo-flare">
                <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#fff' }}>auto_awesome</span>
              </div>
            </div>
          </div>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={handlePhoto} />
          <input ref={galleryRef} type="file" accept="image/*" hidden onChange={handlePhoto} />
        </div>

        {error && <div className="clinic-section"><div className="error-msg">{error}</div></div>}

        {/* Body Info */}
        <section className="clinic-section">
          <div className="clinic-card">
            <div className="clinic-card-header">
              <div className="clinic-card-icon">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>straighten</span>
              </div>
              <h2 className="clinic-card-title">{t(lang, 'bodyInfo')}</h2>
            </div>
            <div className="clinic-routines">
              <div className="clinic-routine">
                <h3 className="clinic-routine-label">{t(lang, 'height')}</h3>
                <input
                  type="number"
                  placeholder="170"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(45,52,54,0.12)', fontSize: '0.95rem', boxSizing: 'border-box', background: 'rgba(45,52,54,0.03)' }}
                />
              </div>
              <div className="clinic-routine clinic-routine-border">
                <h3 className="clinic-routine-label">{t(lang, 'weight')}</h3>
                <input
                  type="number"
                  placeholder="65"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(45,52,54,0.12)', fontSize: '0.95rem', boxSizing: 'border-box', background: 'rgba(45,52,54,0.03)' }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Mode Selection */}
        <section className="clinic-section">
          <div className="clinic-card">
            <div className="clinic-card-header">
              <div className="clinic-card-icon">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>swap_horiz</span>
              </div>
              <h2 className="clinic-card-title">{t(lang, 'fsnModeSelect')}</h2>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button
                onClick={() => setMode('ai')}
                style={{
                  flex: 1,
                  padding: '12px 8px',
                  borderRadius: '12px',
                  border: mode === 'ai' ? '2px solid #E5989B' : '2px solid rgba(45,52,54,0.1)',
                  background: mode === 'ai' ? 'rgba(229,152,155,0.1)' : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s',
                }}
              >
                <span className="material-symbols-outlined" style={{ display: 'block', fontSize: 24, marginBottom: 4, color: mode === 'ai' ? '#E5989B' : 'rgba(45,52,54,0.4)' }}>auto_awesome</span>
                <span style={{ fontSize: '0.82rem', fontWeight: mode === 'ai' ? 600 : 400, color: mode === 'ai' ? '#E5989B' : '#2D3436' }}>{t(lang, 'fsnModeAI')}</span>
              </button>
              <button
                onClick={() => setMode('custom')}
                style={{
                  flex: 1,
                  padding: '12px 8px',
                  borderRadius: '12px',
                  border: mode === 'custom' ? '2px solid #E5989B' : '2px solid rgba(45,52,54,0.1)',
                  background: mode === 'custom' ? 'rgba(229,152,155,0.1)' : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s',
                }}
              >
                <span className="material-symbols-outlined" style={{ display: 'block', fontSize: 24, marginBottom: 4, color: mode === 'custom' ? '#E5989B' : 'rgba(45,52,54,0.4)' }}>upload</span>
                <span style={{ fontSize: '0.82rem', fontWeight: mode === 'custom' ? 600 : 400, color: mode === 'custom' ? '#E5989B' : '#2D3436' }}>{t(lang, 'fsnModeCustom')}</span>
              </button>
            </div>

            {mode === 'ai' ? (
              <div className="clinic-routines">
                <div className="clinic-routine">
                  <h3 className="clinic-routine-label">{t(lang, 'fsnOccasion')}</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {quickOccasions.map((item) => (
                      <button
                        key={item}
                        onClick={() => setOccasion(item)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          border: occasion === item ? '1.5px solid #E5989B' : '1.5px solid rgba(45,52,54,0.1)',
                          background: occasion === item ? 'rgba(229,152,155,0.1)' : 'transparent',
                          color: occasion === item ? '#E5989B' : 'rgba(45,52,54,0.6)',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          fontWeight: occasion === item ? 600 : 400,
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
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(45,52,54,0.12)', fontSize: '0.9rem', boxSizing: 'border-box', background: 'rgba(45,52,54,0.03)' }}
                  />
                </div>
              </div>
            ) : (
              <div className="clinic-routines">
                <div className="clinic-routine">
                  <h3 className="clinic-routine-label">{t(lang, 'fsnUploadClothes')}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'rgba(45,52,54,0.5)', marginBottom: 12 }}>{t(lang, 'fsnUploadClothesDesc')}</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[
                      { label: t(lang, 'fsnClothesTop'), icon: 'checkroom', state: clothesTop, ref: clothesTopRef, handler: handleClothesUpload(setClothesTop) },
                      { label: t(lang, 'fsnClothesBottom'), icon: 'straighten', state: clothesBottom, ref: clothesBottomRef, handler: handleClothesUpload(setClothesBottom) },
                      { label: t(lang, 'fsnClothesOuter'), icon: 'layers', state: clothesOuter, ref: clothesOuterRef, handler: handleClothesUpload(setClothesOuter) },
                    ].map((item) => (
                      <div key={item.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                        <div
                          onClick={() => item.ref.current?.click()}
                          style={{
                            width: '100%',
                            aspectRatio: '3/4',
                            borderRadius: '12px',
                            border: item.state.photo ? '2px solid #E5989B' : '2px dashed rgba(229,152,155,0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            overflow: 'hidden',
                            background: 'rgba(45,52,54,0.02)',
                          }}
                        >
                          {item.state.photo ? (
                            <img src={item.state.photo} alt={item.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span className="material-symbols-outlined" style={{ fontSize: 28, color: 'rgba(229,152,155,0.4)' }}>{item.icon}</span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'rgba(45,52,54,0.6)', fontWeight: 500 }}>{item.label}</span>
                        <input ref={item.ref} type="file" accept="image/*" hidden onChange={item.handler} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <div className="clinic-bottom-cta">
        <div className="clinic-bottom-inner">
          <button className="clinic-start-btn" disabled={!canSubmit} onClick={handleSubmit}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>checkroom</span>
            <span>{t(lang, 'fsnStartStyling')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
