import { useState, useEffect } from 'react'
import { t } from './i18n'

async function handleShare(lang, result, t) {
  const title = t(lang, 'skinClinicReport')
  const text = `${title}\n${t(lang, 'analysisScore')}: ${result.overallScore}/100\n${result.skinType || ''}`

  // base64 이미지를 File로 변환
  let file = null
  if (skinImage) {
    try {
      const res = await fetch(`data:image/png;base64,${skinImage}`)
      const blob = await res.blob()
      file = new File([blob], 'skin-result.png', { type: 'image/png' })
    } catch {}
  }

  // Web Share API 지원 시
  if (navigator.share) {
    try {
      const shareData = { title, text }
      if (file && navigator.canShare?.({ files: [file] })) {
        shareData.files = [file]
      }
      await navigator.share(shareData)
      return 'shared'
    } catch (e) {
      if (e.name === 'AbortError') return null
    }
  }

  // Fallback: 클립보드 복사
  try {
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch {
    return null
  }
}

const ANALYSIS_ICONS = {
  moisture: 'water_drop',
  trouble: 'report',
  pore: 'blur_on',
  wrinkle: 'auto_awesome',
  tone: 'palette',
}

function downloadImage(base64, filename) {
  const link = document.createElement('a')
  link.href = `data:image/png;base64,${base64}`
  link.download = filename
  link.click()
}

function getScoreLevel(score) {
  if (score >= 80) return 4
  if (score >= 60) return 3
  if (score >= 40) return 2
  return 1
}

function SkinResult({ lang, result, photo, photoFile, selections, onSelect, onReset, onNavigate }) {
  const [shareMsg, setShareMsg] = useState(null)
  const [skinImage, setSkinImage] = useState(skinImage || null)
  const [skinImageText, setSkinImageText] = useState(skinImageText || '')
  const [imageLoading, setImageLoading] = useState(!skinImage)
  const scoreLevel = getScoreLevel(result.overallScore || 0)

  useEffect(() => {
    if (skinImage || !photoFile) return
    let cancelled = false
    const fetchImage = async () => {
      try {
        const formData = new FormData()
        formData.append('image', photoFile)
        formData.append('lang', lang)
        const res = await fetch('/api/diagnose-image', { method: 'POST', body: formData })
        if (res.ok && !cancelled) {
          const data = await res.json()
          if (data.skinImage) setSkinImage(data.skinImage)
          if (data.skinImageText) setSkinImageText(data.skinImageText)
        }
      } catch {} finally {
        if (!cancelled) setImageLoading(false)
      }
    }
    fetchImage()
    return () => { cancelled = true }
  }, [skinImage, photoFile, lang])

  const onShare = async () => {
    const status = await handleShare(lang, result, t)
    if (status === 'copied') {
      setShareMsg(t(lang, 'copiedToClipboard'))
      setTimeout(() => setShareMsg(null), 2000)
    }
  }

  return (
    <div className="clinic-page">
      {/* Header */}
      <header className="clinic-header">
        <div className="clinic-header-back" onClick={onReset}>
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </div>
        <h1 className="clinic-header-title">{t(lang, 'analysisResult')}</h1>
        <div className="clinic-header-menu">
          <button className="clinic-icon-btn">
            <span className="material-symbols-outlined">more_horiz</span>
          </button>
        </div>
      </header>

      <main className="clinic-main">
        {/* Report Header */}
        <div className="clinic-section">
          <div className="clinic-report-header">
            <div>
              <span className="clinic-label">{t(lang, 'skinClinicReport')}</span>
              <span className="clinic-scan-title">{result.skinType || 'Skin Analysis'}</span>
            </div>
            <div className="clinic-ai-badge">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>biotech</span>
              <span>{t(lang, 'aiAnalysis')}</span>
            </div>
          </div>

          {/* Photo Comparison: Current vs Glass Target */}
          <div className="clinic-photo-grid">
            <div className="clinic-photo-card">
              {photo ? (
                <img src={photo} alt="Current" className="clinic-photo-img" />
              ) : (
                <div className="clinic-photo-placeholder">
                  <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'rgba(229,152,155,0.4)' }}>person</span>
                </div>
              )}
              <div className="clinic-photo-tag clinic-photo-tag-dark">{t(lang, 'currentPhoto')}</div>
            </div>
            <div className="clinic-photo-card clinic-photo-target">
              {skinImage ? (
                <img
                  src={`data:image/png;base64,${skinImage}`}
                  alt="Glass Target"
                  className="clinic-photo-img"
                />
              ) : (
                <div className="clinic-photo-placeholder">
                  {imageLoading ? (
                    <div style={{ textAlign: 'center' }}>
                      <div className="loader" style={{ width: 32, height: 32, borderTopColor: '#E5989B', margin: '0 auto 8px' }} />
                      <p style={{ fontSize: 11, color: '#E5989B', fontWeight: 600 }}>{t(lang, 'generatingImage') || 'AI 생성 중...'}</p>
                    </div>
                  ) : (
                    <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'rgba(229,152,155,0.4)' }}>auto_awesome</span>
                  )}
                </div>
              )}
              <div className="clinic-photo-tag clinic-photo-tag-pink">{t(lang, 'glassTarget')}</div>
              <div className="clinic-photo-flare">
                <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#fff' }}>flare</span>
              </div>
            </div>
          </div>

          {/* Download / Select buttons */}
          {skinImage && (
            <div className="cr-action-row">
              <button className="cr-action-btn" onClick={() => downloadImage(skinImage, 'skin-simulation.png')}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
                <span>{t(lang, 'downloadImage')}</span>
              </button>
              <button
                className={`cr-action-btn ${selections.skin ? 'cr-action-selected' : 'cr-action-select'}`}
                onClick={() => onSelect('skin', skinImage)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{selections.skin ? 'check_circle' : 'add_circle_outline'}</span>
                <span>{selections.skin ? t(lang, 'selectedForFinal') : t(lang, 'selectForFinal')}</span>
              </button>
            </div>
          )}
        </div>

        {/* Glass Skin Prescription - Improvement Details */}
        {skinImageText && (
          <section className="clinic-section">
            <div className="clinic-card">
              <div className="clinic-card-header">
                <div className="clinic-card-icon">
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>clinical_notes</span>
                </div>
                <h2 className="clinic-card-title">{t(lang, 'glassSkinPrescription')}</h2>
              </div>
              <p className="cr-detail-text">{skinImageText}</p>
            </div>
          </section>
        )}

        {/* Analysis Score Bar */}
        <section className="clinic-section">
          <div className="clinic-score-bar">
            <div className="clinic-score-left">
              <p className="clinic-score-label">{t(lang, 'analysisScore')}</p>
              <p className="clinic-score-value">
                {result.overallScore}
                <span className="clinic-score-max">/100</span>
              </p>
            </div>
            <div className="clinic-score-divider" />
            <div className="clinic-score-right">
              <p className="clinic-score-label" style={{ textAlign: 'right' }}>{t(lang, 'textureLevel')}</p>
              <div className="clinic-texture-dots">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`clinic-dot ${i <= scoreLevel ? 'clinic-dot-active' : ''}`} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Analysis Cards */}
        {Object.keys(result.analysis || {}).length > 0 && (
          <section className="clinic-section">
            <div className="cr-section-header">
              <h2 className="clinic-regimen-title">{t(lang, 'detailedAnalysis')}</h2>
            </div>
            <div className="cr-analysis-list">
              {Object.entries(result.analysis).map(([key, item]) => (
                <div className="cr-analysis-item" key={key}>
                  <div className="cr-analysis-top">
                    <div className="cr-analysis-icon-wrap">
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{ANALYSIS_ICONS[key] || 'science'}</span>
                    </div>
                    <span className="cr-analysis-name">{item.label || key}</span>
                    <span className="cr-analysis-score">{item.score}</span>
                  </div>
                  <p className="cr-analysis-desc">{item.description}</p>
                  {/* Score bar */}
                  <div className="cr-analysis-bar-bg">
                    <div
                      className="cr-analysis-bar-fill"
                      style={{ width: `${Math.min(parseInt(item.score) || 50, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recommended Care */}
        {result.recommendations?.length > 0 && (
          <section className="clinic-section">
            <div className="clinic-card">
              <div className="clinic-card-header">
                <div className="clinic-card-icon">
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>spa</span>
                </div>
                <h2 className="clinic-card-title">{t(lang, 'recommendedCare')}</h2>
              </div>
              <div className="cr-rec-list">
                {result.recommendations.map((rec, i) => (
                  <div className="cr-rec-item" key={i}>
                    <div className="cr-rec-num">{i + 1}</div>
                    <p className="cr-rec-text">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Diet */}
        {result.diet && (
          <section className="clinic-section">
            <div className="clinic-card">
              <div className="clinic-card-header">
                <div className="clinic-card-icon">
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>restaurant</span>
                </div>
                <h2 className="clinic-card-title">{t(lang, 'recommendedDiet')}</h2>
              </div>
              {result.diet.summary && (
                <p className="cr-detail-text" style={{ marginBottom: 16 }}>{result.diet.summary}</p>
              )}
              {result.diet.meals?.map((meal, i) => (
                <div className="cr-meal-item" key={i}>
                  <div className="cr-meal-badge">{meal.type}</div>
                  <div className="cr-meal-body">
                    <p className="cr-meal-menu">{meal.menu}</p>
                    <p className="cr-meal-reason">{meal.reason}</p>
                  </div>
                </div>
              ))}
              {result.diet.nutrients?.length > 0 && (
                <div className="cr-nutrients">
                  <span className="cr-nutrients-label">{t(lang, 'keyNutrients')}</span>
                  <div className="cr-nutrient-tags">
                    {result.diet.nutrients.map((n, i) => (
                      <span className="cr-nutrient-tag" key={i}>{n}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Korean Tea Secret - Disclaimer */}
        {result.disclaimer && (
          <section className="clinic-section">
            <div className="clinic-tea-tip">
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>info</span>
              <div>
                <h4 className="clinic-tea-title">{t(lang, 'disclaimerTitle')}</h4>
                <p className="clinic-tea-desc">{result.disclaimer}</p>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Bottom CTA */}
      <div className="clinic-bottom-cta">
        <div className="clinic-bottom-inner">
          <button className="clinic-start-btn" onClick={onReset}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>face_retouching_natural</span>
            <span>{t(lang, 'tryAgain')}</span>
          </button>
          <button className="clinic-share-btn" onClick={onShare} style={{ position: 'relative' }}>
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
    </div>
  )
}

export default SkinResult
