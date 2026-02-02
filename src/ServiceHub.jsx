import { useState, useRef, useEffect, useCallback } from 'react'
import { t } from './i18n'

const BANNER_SLIDES = [
  '/image1.png',
  '/image2.png',
  '/image3.png',
  '/image4.png',
  '/image5.png',
]

const SLIDE_INTERVAL = 7000
const FPS = 60

function ServiceHub({ lang, userName, photo, onNavigate }) {
  const [activeSlide, setActiveSlide] = useState(0)
  const [fading, setFading] = useState(false)
  const containerRef = useRef(null)
  const imgRef = useRef(null)
  const rafRef = useRef(null)
  const panX = useRef(0)
  const dragging = useRef(false)
  const dragStartX = useRef(0)
  const dragPanStart = useRef(0)
  const timerRef = useRef(null)
  const pendingSlide = useRef(null)

  const getMaxPan = useCallback(() => {
    const img = imgRef.current
    const box = containerRef.current
    if (!img || !box || !img.naturalWidth) return 0
    const renderedW = img.naturalWidth * (box.offsetHeight / img.naturalHeight)
    return Math.max(0, renderedW - box.offsetWidth)
  }, [])

  const applyPan = useCallback(() => {
    if (imgRef.current) {
      imgRef.current.style.transform = `translateX(-${panX.current}px)`
    }
  }, [])

  const animate = useCallback(() => {
    if (!dragging.current) {
      const max = getMaxPan()
      if (max > 0) {
        const speed = max / ((SLIDE_INTERVAL / 1000) * FPS)
        panX.current = Math.min(panX.current + speed, max)
        applyPan()
      }
    }
    rafRef.current = requestAnimationFrame(animate)
  }, [getMaxPan, applyPan])

  const changeSlide = useCallback((idx) => {
    pendingSlide.current = idx
    setFading(true)
    setTimeout(() => {
      setActiveSlide(idx)
      panX.current = 0
      applyPan()
      setFading(false)
    }, 300)
  }, [applyPan])

  const startTimer = useCallback(() => {
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      if (!dragging.current) {
        changeSlide((pendingSlide.current ?? 0 + 1) % BANNER_SLIDES.length)
      }
    }, SLIDE_INTERVAL)
  }, [changeSlide])

  // Auto-advance: use activeSlide to compute next
  useEffect(() => {
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      if (!dragging.current) {
        const next = (activeSlide + 1) % BANNER_SLIDES.length
        changeSlide(next)
      }
    }, SLIDE_INTERVAL)
    return () => clearInterval(timerRef.current)
  }, [activeSlide, changeSlide])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [animate])

  const onPointerDown = (e) => {
    dragging.current = true
    dragStartX.current = e.clientX ?? e.touches?.[0]?.clientX ?? 0
    dragPanStart.current = panX.current
    e.preventDefault()
  }

  const onPointerMove = (e) => {
    if (!dragging.current) return
    const x = e.clientX ?? e.touches?.[0]?.clientX ?? 0
    const delta = dragStartX.current - x
    const max = getMaxPan()
    panX.current = Math.max(0, Math.min(dragPanStart.current + delta, max))
    applyPan()
  }

  const onPointerUp = (e) => {
    if (!dragging.current) return
    const endX = e.clientX ?? e.changedTouches?.[0]?.clientX ?? 0
    const delta = dragStartX.current - endX
    if (Math.abs(delta) > 80) {
      if (delta > 0) {
        changeSlide((activeSlide + 1) % BANNER_SLIDES.length)
      } else {
        changeSlide((activeSlide - 1 + BANNER_SLIDES.length) % BANNER_SLIDES.length)
      }
    }
    dragging.current = false
  }

  const goToSlide = (idx) => {
    changeSlide(idx)
  }

  return (
    <div className="hub-page">
      {/* Header */}
      <header className="hub-header">
        <div className="hub-avatar">
          {photo ? (
            <img src={photo} alt="Profile" className="hub-avatar-img" />
          ) : (
            <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#ee2b8c' }}>person</span>
          )}
        </div>
        <div className="hub-header-text">
          <p className="hub-header-label">{t(lang, 'hubStyleProfile')}</p>
          <h2 className="hub-header-name">
            {t(lang, 'hubWelcome')}{userName ? `, ${userName}` : ''}
          </h2>
        </div>
        <button className="hub-notif-btn">
          <span className="material-symbols-outlined">notifications</span>
          <span className="hub-notif-dot" />
        </button>
      </header>

      {/* Carousel Banner */}
      <div className="hub-banner-wrap">
        <div
          className="hub-carousel"
          ref={containerRef}
          onMouseDown={onPointerDown}
          onMouseMove={onPointerMove}
          onMouseUp={onPointerUp}
          onMouseLeave={onPointerUp}
          onTouchStart={onPointerDown}
          onTouchMove={onPointerMove}
          onTouchEnd={onPointerUp}
        >
          <img
            ref={imgRef}
            src={BANNER_SLIDES[activeSlide]}
            alt=""
            className={'hub-carousel-img' + (fading ? ' hub-carousel-fade' : '')}
            draggable={false}
          />
        </div>
        <div className="hub-carousel-dots">
          {BANNER_SLIDES.map((_, i) => (
            <button
              key={i}
              className={'hub-carousel-dot' + (i === activeSlide ? ' hub-carousel-dot-active' : '')}
              onClick={() => goToSlide(i)}
            />
          ))}
        </div>
      </div>

      {/* Core Services */}
      <div className="hub-section-header">
        <h3 className="hub-section-title">{t(lang, 'hubCoreServices')}</h3>
        <button className="hub-view-all">{t(lang, 'hubViewAll')}</button>
      </div>

      <div className="hub-grid">
        {/* Skin Analysis */}
        <div className="hub-card" onClick={() => onNavigate('skin')}>
          <div className="hub-card-icon hub-icon-pink">
            <span className="material-symbols-outlined" style={{ fontSize: 32 }}>auto_awesome</span>
          </div>
          <div className="hub-card-text">
            <h2 className="hub-card-title">{t(lang, 'hubSkin')}</h2>
            <p className="hub-card-sub hub-sub-pink">{t(lang, 'hubSkinSub')}</p>
          </div>
        </div>

        {/* Hair Style */}
        <div className="hub-card" onClick={() => onNavigate('hairstyle')}>
          <div className="hub-card-icon hub-icon-blue">
            <span className="material-symbols-outlined" style={{ fontSize: 32 }}>content_cut</span>
          </div>
          <div className="hub-card-text">
            <h2 className="hub-card-title">{t(lang, 'hubHair')}</h2>
            <p className="hub-card-sub hub-sub-blue">{t(lang, 'hubHairSub')}</p>
          </div>
        </div>

        {/* K-Fit Routine */}
        <div className="hub-card" onClick={() => onNavigate('diet')}>
          <div className="hub-card-icon hub-icon-green">
            <span className="material-symbols-outlined" style={{ fontSize: 32 }}>ecg_heart</span>
          </div>
          <div className="hub-card-text">
            <h2 className="hub-card-title">{t(lang, 'hubDiet')}</h2>
            <p className="hub-card-sub hub-sub-green">{t(lang, 'hubDietSub')}</p>
          </div>
        </div>

        {/* K-Makeup */}
        <div className="hub-card" onClick={() => onNavigate('makeup')}>
          <div className="hub-card-icon hub-icon-purple">
            <span className="material-symbols-outlined" style={{ fontSize: 32 }}>palette</span>
          </div>
          <div className="hub-card-text">
            <h2 className="hub-card-title">{t(lang, 'hubMakeup')}</h2>
            <p className="hub-card-sub hub-sub-purple">{t(lang, 'hubMakeupSub')}</p>
          </div>
        </div>

        {/* Fashion - full width highlighted */}
        <div className="hub-card-fashion" onClick={() => onNavigate('fashion')}>
          <div className="hub-fashion-icon">
            <span className="material-symbols-outlined" style={{ fontSize: 32 }}>checkroom</span>
          </div>
          <div className="hub-fashion-text">
            <div className="hub-fashion-title-row">
              <h2 className="hub-fashion-title">{t(lang, 'hubFashion')}</h2>
              <span className="hub-hot-badge">HOT</span>
            </div>
            <p className="hub-fashion-sub">{t(lang, 'hubFashionSub')}</p>
          </div>
          <span className="material-symbols-outlined hub-fashion-arrow">chevron_right</span>
        </div>
      </div>

      {/* Spacer for bottom nav */}
      <div style={{ height: 96 }} />

      {/* Bottom Nav */}
      <div className="hub-bottom-nav-wrap">
        <div className="hub-bottom-nav">
          <a className="hub-nav-item hub-nav-active" onClick={() => {}}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
            <p>{t(lang, 'hubNavHome')}</p>
          </a>
          <a className="hub-nav-item" onClick={() => onNavigate('fashion')}>
            <span className="material-symbols-outlined">styler</span>
            <p>{t(lang, 'hubNavWardrobe')}</p>
          </a>
          <a className="hub-nav-item" onClick={() => {}}>
            <span className="material-symbols-outlined">groups</span>
            <p>{t(lang, 'hubNavCommunity')}</p>
          </a>
          <a className="hub-nav-item" onClick={() => onNavigate('profile')}>
            <span className="material-symbols-outlined">account_circle</span>
            <p>{t(lang, 'hubNavProfile')}</p>
          </a>
        </div>
      </div>
    </div>
  )
}

export default ServiceHub
