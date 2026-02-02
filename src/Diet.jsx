import { useState, useRef } from 'react'
import { t } from './i18n'

async function handleShare(lang, result, tFn) {
  const title = 'Body Plan Report'
  const text = `${title}\nBMI: ${result.bodyAnalysis?.bmi || ''}\n${result.bodyAnalysis?.bodyType || ''}`

  let file = null
  if (result.bodyImage) {
    try {
      const res = await fetch(`data:image/png;base64,${result.bodyImage}`)
      const blob = await res.blob()
      file = new File([blob], 'body-plan.png', { type: 'image/png' })
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

export default function Diet({ lang, onBack, onSelect, selected }) {
  const [photo, setPhoto] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [goalType, setGoalType] = useState('diet')
  const [goalWeight, setGoalWeight] = useState('')
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
    if (!photoFile || !height || !weight || !goalWeight) return
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('image', photoFile)
      formData.append('height', height)
      formData.append('weight', weight)
      formData.append('goalType', goalType)
      formData.append('goalWeight', goalWeight)
      formData.append('lang', lang)

      const res = await fetch('/api/diet', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to generate body plan')
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
    setGoalType('diet')
    setGoalWeight('')
  }

  // Loading screen
  if (loading) {
    return (
      <div className="clinic-page">
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <div className="loader" />
          <p style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 500, fontSize: '1rem', color: '#2D3436' }}>{t(lang, 'dietLoading')}</p>
          <p style={{ fontSize: '13px', color: 'rgba(45,52,54,0.6)' }}>{t(lang, 'dietLoadingSub')}</p>
        </div>
      </div>
    )
  }

  // Result screen
  if (result) {
    return (
      <div className="clinic-page">
        <header className="clinic-header">
          <div className="clinic-header-back" onClick={handleReset}>
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </div>
          <h1 className="clinic-header-title">{t(lang, 'dietResultTitle')}</h1>
          <div className="clinic-header-menu">
            {result.bodyImage && (
              <button className="clinic-icon-btn" onClick={() => downloadImage(result.bodyImage, 'body-plan.png')}>
                <span className="material-symbols-outlined">download</span>
              </button>
            )}
          </div>
        </header>

        <main className="clinic-main">
          {/* Report header */}
          <div className="clinic-section" style={{ paddingTop: 24 }}>
            <div className="clinic-report-header">
              <div>
                <span className="clinic-label">Body Plan Report</span>
                <span className="clinic-scan-title">{t(lang, 'dietResultSub')}</span>
              </div>
              <div className="clinic-ai-badge">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>auto_awesome</span>
                <span>AI Body Plan</span>
              </div>
            </div>

            {/* Body transformation image */}
            {result.bodyImage && (
              <>
                <div style={{ borderRadius: '1rem', overflow: 'hidden', border: '1px solid rgba(253,226,228,0.5)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                  <img
                    src={`data:image/png;base64,${result.bodyImage}`}
                    alt="Body transformation"
                    style={{ width: '100%', display: 'block' }}
                  />
                </div>
                <div className="cr-action-row">
                  <button className="cr-action-btn" onClick={() => downloadImage(result.bodyImage, 'body-plan.png')}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
                    {t(lang, 'downloadImage')}
                  </button>
                  <button
                    className={`cr-action-btn ${selected ? 'cr-action-btn-selected' : 'cr-action-btn-select'}`}
                    onClick={() => onSelect?.(result.bodyImage)}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{selected ? 'check_circle' : 'add_circle_outline'}</span>
                    {selected ? t(lang, 'selectedForFinal') : t(lang, 'selectForFinal')}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Body Analysis Card */}
          {result.bodyAnalysis && (
            <div className="clinic-section">
              <div className="clinic-card">
                <div className="clinic-card-header">
                  <div className="clinic-card-icon">
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>monitor_weight</span>
                  </div>
                  <h2 className="clinic-card-title">{t(lang, 'dietBodyAnalysis')}</h2>
                </div>
                <div className="clinic-routines">
                  <div className="clinic-routine">
                    <h3 className="clinic-routine-label">BMI</h3>
                    <p className="clinic-routine-text"><strong>{result.bodyAnalysis.bmi}</strong></p>
                  </div>
                  <div className="clinic-routine clinic-routine-border">
                    <h3 className="clinic-routine-label">{t(lang, 'dietBodyType')}</h3>
                    <p className="clinic-routine-text"><strong>{result.bodyAnalysis.bodyType}</strong></p>
                  </div>
                  <div className="clinic-routine clinic-routine-border">
                    <h3 className="clinic-routine-label">{t(lang, 'dietGoalStrategy')}</h3>
                    <p className="clinic-routine-text">{result.bodyAnalysis.strategy}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Management Card (exercise + lifestyle) */}
          {result.management && (
            <div className="clinic-section">
              <div className="clinic-card">
                <div className="clinic-card-header">
                  <div className="clinic-card-icon">
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>fitness_center</span>
                  </div>
                  <h2 className="clinic-card-title">{t(lang, 'dietManagement')}</h2>
                </div>
                <div className="clinic-routines">
                  {result.management.exerciseRoutine && (
                    <div className="clinic-routine">
                      <h3 className="clinic-routine-label">{t(lang, 'dietExercise')}</h3>
                      <p className="clinic-routine-text">{result.management.exerciseRoutine}</p>
                    </div>
                  )}
                  {result.management.lifestyle && (
                    <div className="clinic-routine clinic-routine-border">
                      <h3 className="clinic-routine-label">{t(lang, 'dietLifestyle')}</h3>
                      <p className="clinic-routine-text">{result.management.lifestyle}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Meal Plan Card */}
          {result.mealPlan && (
            <div className="clinic-section">
              <div className="clinic-card">
                <div className="clinic-card-header">
                  <div className="clinic-card-icon">
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>restaurant</span>
                  </div>
                  <h2 className="clinic-card-title">{t(lang, 'dietMealPlan')}</h2>
                </div>
                {result.mealPlan.dailyCalories && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                    <span className="clinic-nutrient-tag">{result.mealPlan.dailyCalories} kcal/day</span>
                  </div>
                )}
                <div className="clinic-routines">
                  {result.mealPlan.meals?.map((meal, i) => (
                    <div key={i} className={`clinic-routine ${i > 0 ? 'clinic-routine-border' : ''}`}>
                      <h3 className="clinic-routine-label">{meal.type}</h3>
                      <p className="clinic-routine-text"><strong>{meal.menu}</strong> ({meal.calories})</p>
                      <p className="clinic-routine-text" style={{ color: 'rgba(45,52,54,0.6)', marginTop: 2 }}>{meal.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Key Nutrients */}
          {result.keyNutrients && result.keyNutrients.length > 0 && (
            <div className="clinic-section">
              <div className="clinic-card">
                <div className="clinic-card-header">
                  <div className="clinic-card-icon">
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>science</span>
                  </div>
                  <h2 className="clinic-card-title">{t(lang, 'dietKeyNutrients')}</h2>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {result.keyNutrients.map((n, i) => (
                    <span key={i} className="clinic-nutrient-tag">{n}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          {result.disclaimer && (
            <div className="clinic-section">
              <p style={{ fontSize: '11px', color: 'rgba(45,52,54,0.5)', lineHeight: 1.6, textAlign: 'center' }}>{result.disclaimer}</p>
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
        <h1 className="clinic-header-title">{t(lang, 'dietTitle')}</h1>
        <div className="clinic-header-menu">
          <button className="clinic-icon-btn">
            <span className="material-symbols-outlined">more_horiz</span>
          </button>
        </div>
      </header>

      <main className="clinic-main">
        {/* Report header + photo grid */}
        <div className="clinic-section" style={{ paddingTop: 24 }}>
          <div className="clinic-report-header">
            <div>
              <span className="clinic-label">Body Clinic</span>
              <span className="clinic-scan-title">{t(lang, 'dietSubtitle')}</span>
            </div>
            <div className="clinic-ai-badge">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>fitness_center</span>
              <span>AI Coach</span>
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
                  backgroundImage: 'url("https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=500&fit=crop")',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  width: '100%',
                  height: '100%',
                }}
              />
              <div className="clinic-photo-tag clinic-photo-tag-pink">Fit Target</div>
              <div className="clinic-photo-flare">
                <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#fff' }}>auto_awesome</span>
              </div>
            </div>
          </div>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={handlePhoto} />
          <input ref={galleryRef} type="file" accept="image/*" hidden onChange={handlePhoto} />
        </div>

        {error && <div className="clinic-section"><div className="error-msg">{error}</div></div>}

        {/* Body Info Card */}
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
                  placeholder="75"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(45,52,54,0.12)', fontSize: '0.95rem', boxSizing: 'border-box', background: 'rgba(45,52,54,0.03)' }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Goal Selection Card */}
        <section className="clinic-section">
          <div className="clinic-card">
            <div className="clinic-card-header">
              <div className="clinic-card-icon">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>target</span>
              </div>
              <h2 className="clinic-card-title">{t(lang, 'dietGoalSelect')}</h2>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button
                onClick={() => setGoalType('diet')}
                style={{
                  flex: 1,
                  padding: '12px 8px',
                  borderRadius: '12px',
                  border: goalType === 'diet' ? '2px solid #E5989B' : '2px solid rgba(45,52,54,0.1)',
                  background: goalType === 'diet' ? 'rgba(229,152,155,0.1)' : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s',
                }}
              >
                <span style={{ display: 'block', fontSize: '1.2rem', marginBottom: 4 }}>🔥</span>
                <span style={{ fontSize: '0.85rem', fontWeight: goalType === 'diet' ? 600 : 400, color: goalType === 'diet' ? '#E5989B' : '#2D3436' }}>{t(lang, 'dietGoalDiet')}</span>
              </button>
              <button
                onClick={() => setGoalType('bulk')}
                style={{
                  flex: 1,
                  padding: '12px 8px',
                  borderRadius: '12px',
                  border: goalType === 'bulk' ? '2px solid #E5989B' : '2px solid rgba(45,52,54,0.1)',
                  background: goalType === 'bulk' ? 'rgba(229,152,155,0.1)' : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s',
                }}
              >
                <span style={{ display: 'block', fontSize: '1.2rem', marginBottom: 4 }}>💪</span>
                <span style={{ fontSize: '0.85rem', fontWeight: goalType === 'bulk' ? 600 : 400, color: goalType === 'bulk' ? '#E5989B' : '#2D3436' }}>{t(lang, 'dietGoalBulk')}</span>
              </button>
            </div>
            <div className="clinic-routines">
              <div className="clinic-routine">
                <h3 className="clinic-routine-label">{t(lang, 'dietGoalWeight')}</h3>
                <input
                  type="number"
                  placeholder={goalType === 'diet' ? '65' : '80'}
                  value={goalWeight}
                  onChange={(e) => setGoalWeight(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(45,52,54,0.12)', fontSize: '0.95rem', boxSizing: 'border-box', background: 'rgba(45,52,54,0.03)' }}
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <div className="clinic-bottom-cta">
        <div className="clinic-bottom-inner">
          <button className="clinic-start-btn" disabled={!photoFile || !height || !weight || !goalWeight} onClick={handleSubmit}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>fitness_center</span>
            <span>{t(lang, 'dietStartPlan')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
