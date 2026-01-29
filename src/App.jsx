import { useState, useRef } from 'react'
import './App.css'

function App() {
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [photo, setPhoto] = useState(null)
  const cameraRef = useRef(null)
  const galleryRef = useRef(null)

  const handlePhoto = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhoto(URL.createObjectURL(file))
    }
  }

  const isValid = height && weight

  return (
    <div className="app">
      <header className="header">
        <h1>Beauty</h1>
        <p>나만의 뷰티 분석을 시작하세요</p>
      </header>

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
        <button className="cta-btn" disabled={!isValid}>
          다음
        </button>
      </div>
    </div>
  )
}

export default App
