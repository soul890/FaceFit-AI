import { useState, useRef } from 'react'
import './App.css'

const ANALYSIS_LABELS = {
  moisture: '수분도',
  trouble: '트러블',
  pore: '모공',
  wrinkle: '주름',
  tone: '피부톤',
}

const ANALYSIS_ICONS = {
  moisture: '💧',
  trouble: '🔴',
  pore: '🔬',
  wrinkle: '✨',
  tone: '🎨',
}

function App() {
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
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

  const isValid = height && weight

  const handleSubmit = async () => {
    if (!isValid) return
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('height', height)
      formData.append('weight', weight)
      if (photoFile) {
        formData.append('image', photoFile)
      }

      const res = await fetch('/api/diagnose', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '분석에 실패했습니다')
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
  }

  if (loading) {
    return (
      <div className="app loading-screen">
        <div className="loader" />
        <p className="loading-text">피부를 분석하고 있어요...</p>
      </div>
    )
  }

  if (result) {
    return (
      <div className="app">
        <header className="header">
          <h1>분석 결과</h1>
          <p>당신의 피부 리포트</p>
        </header>

        <div className="card score-card">
          <div className="score-circle">
            <span className="score-value">{result.overallScore}</span>
            <span className="score-label">종합점수</span>
          </div>
          <p className="skin-type">{result.skinType}</p>
        </div>

        <div className="analysis-grid">
          {Object.entries(result.analysis || {}).map(([key, item]) => (
            <div className="card analysis-card" key={key}>
              <div className="analysis-header">
                <span className="analysis-icon">{ANALYSIS_ICONS[key]}</span>
                <span className="analysis-name">{ANALYSIS_LABELS[key] || key}</span>
                <span className="analysis-score">{item.score}</span>
              </div>
              <p className="analysis-desc">{item.description}</p>
            </div>
          ))}
        </div>

        {result.recommendations?.length > 0 && (
          <div className="card">
            <h2>추천 케어</h2>
            <ul className="recommendations">
              {result.recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="cta-container">
          <button className="cta-btn" onClick={handleReset}>
            다시 분석하기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Beauty</h1>
        <p>나만의 뷰티 분석을 시작하세요</p>
      </header>

      {error && <div className="error-msg">{error}</div>}

      <div className="card">
        <h2>기본 정보</h2>
        <div className="input-group">
          <div className="input-field">
            <label>키</label>
            <input
              type="number"
              placeholder="cm"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
          </div>
          <div className="input-field">
            <label>몸무게</label>
            <input
              type="number"
              placeholder="kg"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <h2>사진</h2>
        <div className="photo-buttons">
          <button className="photo-btn" onClick={() => cameraRef.current?.click()}>
            <span className="icon">📷</span>
            촬영
          </button>
          <button className="photo-btn" onClick={() => galleryRef.current?.click()}>
            <span className="icon">🖼️</span>
            갤러리
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
            <img src={photo} alt="미리보기" />
          </div>
        )}
      </div>

      <div className="cta-container">
        <button className="cta-btn" disabled={!isValid} onClick={handleSubmit}>
          다음
        </button>
      </div>
    </div>
  )
}

export default App
