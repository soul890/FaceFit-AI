import LanguageSelector from './LanguageSelector'

function Home({ lang, setLang, onStartGlowUp }) {
  return (
    <>
      <div className="home-bg" />
      <div className="home-bg-lines" />
      <div className="home-page">
        <div className="home-header">
          <LanguageSelector lang={lang} setLang={setLang} />
          <div className="home-badge">
            <span className="material-symbols-outlined">verified_user</span>
            <span>Global Edition</span>
          </div>
          <h1 className="home-title">
            <span className="home-title-sub">K-STYLE AI</span>
            <span className="home-title-main">Your Seoul Stylist</span>
          </h1>
          <p className="home-desc">
            Premium skincare, fashion, and diet advice powered by AI.
          </p>
        </div>

        <div className="photo-showcase">
          <div className="photo-showcase-inner">
            <div className="photo-main-card" onClick={onStartGlowUp}>
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBoX81TUDrvaNkoTaEosc1L7RAZ7rOcl_UCgojWArBvHE9d8DDK70XtV2wpKcGCTPhxP5UJtmXy0z4KGG6nFdBFaOPOGFoD6MGWq1PAr4-Gr3futl6p-aALxnbF_Ublri6HUrnx5FEe9RcbmM064yAsKJHBqua9Lp0Oq6_vS4Eb--Oamuo74b1IzOv8vFt0NBxecfwOcMmBFGGgTsqh7UN-4hYQdKxsbI54fP11u72lfemL5iR5XbVHrEadPpJklY-VCzpN7BEfd7oH"
                alt="K-Style Model"
              />
              <div className="scan-line" />
              <div className="card-overlay" />
              <div className="card-ar-icon">
                <span className="material-symbols-outlined">view_in_ar</span>
              </div>
              <div className="card-ai-label">
                <div className="card-ai-dot" />
                <span className="card-ai-text">AI Analysis</span>
              </div>
            </div>
            <div className="photo-side-left">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAIWZPEIjYj4JMUNFSqFwHnGaH0xo6pzfvIUMxb8yjH1-XwlKhKp1u44mzbG7lwKwp858E5rHAVWWi74tVcVhtgK57mlLdMes0T4Wgq5TkwHMR96bh6Y1YMs10MhNaBYQT9IqqqQfztboyNBTS-aoL2R4T4wPx0iUY0HpH_ntu4NYy7WV2gAC5xKQ1JyqyjN4XG91otZ-LGYAUW3FLJCSxz6k0rTHBa-ta2-kmcMQN0KJH47ZY2KPvKIGh2NBLo9gLkYs_1zaqtCiwy"
                alt="K-Fashion"
              />
            </div>
            <div className="photo-side-right">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC34HhwbFYigK6kI8kAEmc1V5IbNcHLEdYwo2DwvJspi9kx0WuU40XPI-e4c37EL0uMR9W8EhGip2mOos_HiVLyx8YR9CMMOWjn4U7CLO0fRHk8SYhRiatLTRxM1WIzFJ3qrGdWWOy2C7zs2Ga3ISZPCr6gZ4sK6JiXB_M-dwvQu4lAAv4wvg9i25BQhSYfiw4vSO7dJtHoGA_qUGnLZlqPnXvt6mzi9_SlyzDx0ThZVoniCKVmGL_wyh3Au8ePzaw1E5Whp-8k9q36"
                alt="K-Beauty"
              />
            </div>
            <div className="photo-sparkle">
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>auto_awesome</span>
            </div>
            <div className="photo-flare">
              <span className="material-symbols-outlined" style={{ fontSize: 32 }}>flare</span>
            </div>
          </div>
        </div>

        <div className="home-bottom">
          <p className="home-tagline">Unlock the Secrets of K-Beauty</p>
          <button className="home-cta" onClick={onStartGlowUp}>
            <span>Start Your Glow Up</span>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_forward_ios</span>
          </button>
          <div className="home-footer-tags">
            <span>Skincare</span>
            <div className="home-footer-dot-pink" />
            <span>Fashion</span>
            <div className="home-footer-dot-blue" />
            <span>Lifestyle</span>
          </div>
        </div>
      </div>
    </>
  )
}

export default Home
