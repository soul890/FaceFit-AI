import { useState, useRef } from 'react'
import { t } from './i18n'

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
      formData.append('height', height)
      formData.append('weight', weight)
      formData.append('lang', lang)

      const res = await fetch('/api/diet', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to generate diet plan')
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
  }

  if (loading) {
    return (
      <div className="app loading-screen">
        <div className="loader" />
        <p className="loading-text">{t(lang, 'dietLoading')}</p>
        <p className="loading-sub">{t(lang, 'dietLoadingSub')}</p>
      </div>
    )
  }

  if (result) {
    return (
      <div className="app">
        <header className="header">
          <h1>{t(lang, 'dietResultTitle')}</h1>
          <p>{t(lang, 'dietResultSub')}</p>
        </header>

        {result.transformImage && (
          <div className="card hair-result-card">
            <h2>{t(lang, 'transformPreview')}</h2>
            <img
              className="hair-result-image"
              src={`data:image/png;base64,${result.transformImage}`}
              alt="Weight transformation simulation"
            />
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                className="download-btn"
                onClick={() => downloadImage(result.transformImage, 'diet-transformation.png')}
              >
                {t(lang, 'downloadImage')}
              </button>
              <button
                className={`download-btn ${selected ? 'selected-btn' : 'select-btn'}`}
                onClick={() => onSelect?.(result.transformImage)}
              >
                {selected ? t(lang, 'selectedForFinal') : t(lang, 'selectForFinal')}
              </button>
            </div>
          </div>
        )}

        {result.currentAnalysis && (
          <div className="card score-card">
            <div className="score-circle">
              <span className="score-value" style={{ fontSize: '1rem' }}>{result.currentAnalysis.estimatedWeight}</span>
              <span className="score-label">{t(lang, 'current')}</span>
            </div>
            <div className="score-circle">
              <span className="score-value" style={{ fontSize: '1rem' }}>{result.goal?.optimalWeight}</span>
              <span className="score-label">{t(lang, 'goal')}</span>
            </div>
            <p className="skin-type">{result.currentAnalysis.bodyType}</p>
            <p className="analysis-desc">{result.currentAnalysis.facialAnalysis}</p>
          </div>
        )}

        {result.goal && (
          <div className="card">
            <h2>{t(lang, 'goalTitle')}</h2>
            <p className="analysis-desc">{result.goal.summary}</p>
            <div className="nutrients">
              <div className="nutrient-tags">
                <span className="nutrient-tag">{result.goal.weightToLose}</span>
                <span className="nutrient-tag">{result.goal.estimatedDuration}</span>
              </div>
            </div>
          </div>
        )}

        {result.mealPlan && (
          <div className="card diet-card">
            <h2>{t(lang, 'mealPlan')}</h2>
            <div className="nutrients" style={{ marginBottom: '1rem' }}>
              <div className="nutrient-tags">
                <span className="nutrient-tag">{result.mealPlan.dailyCalories} kcal/day</span>
                <span className="nutrient-tag">C/P/F: {result.mealPlan.macroRatio}</span>
              </div>
            </div>
            {result.mealPlan.meals?.map((meal, i) => (
              <div className="meal-item" key={i}>
                <span className="meal-type">{meal.type}</span>
                <div className="meal-detail">
                  <p className="meal-menu">{meal.menu} ({meal.calories})</p>
                  <p className="meal-reason">{meal.reason}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {result.mealPlan?.weeklyPlan && (
          <div className="card">
            <h2>{t(lang, 'weeklyMealPlan')}</h2>
            {result.mealPlan.weeklyPlan.map((day, i) => (
              <div className="meal-item" key={i} style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                <span className="meal-type">{day.day}</span>
                <div className="meal-detail">
                  <p className="meal-menu">🌅 {day.breakfast}</p>
                  <p className="meal-menu">☀️ {day.lunch}</p>
                  <p className="meal-menu">🌙 {day.dinner}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {result.workoutPlan && (
          <div className="card">
            <h2>{t(lang, 'workoutPlan')}</h2>
            <p className="analysis-desc">{result.workoutPlan.summary}</p>
            {result.workoutPlan.schedule?.map((day, i) => (
              <div key={i} style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '0.75rem' }}>
                <strong>{day.day} — {day.focus}</strong>
                {day.exercises?.map((ex, j) => (
                  <div className="meal-item" key={j}>
                    <span className="meal-type" style={{ minWidth: 'auto', fontSize: '0.8rem' }}>{ex.name}</span>
                    <div className="meal-detail">
                      <p className="meal-menu">{ex.sets} sets × {ex.reps} | Rest: {ex.rest}</p>
                      {ex.note && <p className="meal-reason">{ex.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ))}
            {result.workoutPlan.beginnerTip && (
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#f0f9ff', borderRadius: '8px' }}>
                <strong>{t(lang, 'beginner')}</strong> {result.workoutPlan.beginnerTip}
              </div>
            )}
            {result.workoutPlan.intermediateTip && (
              <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#fff7ed', borderRadius: '8px' }}>
                <strong>{t(lang, 'intermediate')}</strong> {result.workoutPlan.intermediateTip}
              </div>
            )}
          </div>
        )}

        {result.supplements?.length > 0 && (
          <div className="card">
            <h2>{t(lang, 'supplements')}</h2>
            {result.supplements.map((sup, i) => (
              <div className="meal-item" key={i}>
                <span className="meal-type">{sup.name}</span>
                <div className="meal-detail">
                  <p className="meal-menu">{sup.dosage}</p>
                  <p className="meal-reason">{sup.reason}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {result.motivation && (
          <div className="card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', textAlign: 'center' }}>
            <h2 style={{ color: 'white' }}>{t(lang, 'motivation')}</h2>
            <p style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>{result.motivation}</p>
          </div>
        )}

        {result.disclaimer && (
          <p className="disclaimer">{result.disclaimer}</p>
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
        <h1>{t(lang, 'dietTitle')}</h1>
        <p>{t(lang, 'dietSubtitle')}</p>
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

      <div className="card">
        <h2>{t(lang, 'bodyInfo')}</h2>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem', display: 'block' }}>{t(lang, 'height')}</label>
            <input
              type="number"
              placeholder="170"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #ddd', fontSize: '1rem', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem', display: 'block' }}>{t(lang, 'weight')}</label>
            <input
              type="number"
              placeholder="75"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #ddd', fontSize: '1rem', boxSizing: 'border-box' }}
            />
          </div>
        </div>
      </div>

      <div className="cta-container">
        <button className="cta-btn" disabled={!photoFile || !height || !weight} onClick={handleSubmit}>
          {t(lang, 'startTransformation')}
        </button>
      </div>
    </div>
  )
}
