import { useRef } from 'react'
import { t } from './i18n'

function PhotoUpload({ lang, setLang, photo, photoFile, error, selections, selectedCount, onPhoto, onSubmit, onNavigate, onBack }) {
  const cameraRef = useRef(null)
  const galleryRef = useRef(null)

  const handlePhoto = (e) => {
    const file = e.target.files?.[0]
    if (file) onPhoto(file)
  }

  return (
    <div className="clinic-page">
      {/* Header */}
      <header className="clinic-header">
        <div className="clinic-header-back" onClick={onBack}>
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </div>
        <h1 className="clinic-header-title">K-Glass Skin Analysis</h1>
        <div className="clinic-header-menu">
          <button className="clinic-icon-btn">
            <span className="material-symbols-outlined">more_horiz</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="clinic-main">
        {/* Report header */}
        <div className="clinic-section">
          <div className="clinic-report-header">
            <div>
              <span className="clinic-label">Skin Clinic Report</span>
              <span className="clinic-scan-title">Luminosity Scan</span>
            </div>
            <div className="clinic-ai-badge">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>biotech</span>
              <span>AI Analysis</span>
            </div>
          </div>

          {/* Photo comparison */}
          <div className="clinic-photo-grid">
            <div className="clinic-photo-card" onClick={() => cameraRef.current?.click()}>
              {photo ? (
                <img src={photo} alt="Current" className="clinic-photo-img" />
              ) : (
                <div className="clinic-photo-placeholder">
                  <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'rgba(229,152,155,0.5)' }}>add_a_photo</span>
                </div>
              )}
              <div className="clinic-photo-tag clinic-photo-tag-dark">Current</div>
            </div>
            <div className="clinic-photo-card clinic-photo-target">
              <div
                className="clinic-photo-img"
                style={{
                  backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCxiROjzTK3Y2JWJK4GBvYd9m-kqI5-7p3H2kkRLyZo6ozmVesYngzYlFG-68TahC8ft-AVKKuBAb0-XKrv8kHxOw3AMgydDpKcyArZkrvDb54zZmnoIbNAM56KNAPTUlIAEG_33-hFat9cPC7PlpJvPn-uF2Ee65wT1WSlY7pGl7xIP36981ehRl9Q4aKsIpmPMWAh1560MKz1p7yyrHTwA-efbqyXl503L3HwFRiFl5kLcwOV5tsa9-KNUJFRPi0MdrkbLUeq5t9h")',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  width: '100%',
                  height: '100%',
                }}
              />
              <div className="clinic-photo-tag clinic-photo-tag-pink">Glass Target</div>
              <div className="clinic-photo-flare">
                <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#fff' }}>flare</span>
              </div>
            </div>
          </div>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={handlePhoto} />
          <input ref={galleryRef} type="file" accept="image/*" hidden onChange={handlePhoto} />
        </div>

        {error && <div className="clinic-section"><div className="error-msg">{error}</div></div>}

        {/* Glass Skin Prescription */}
        <section className="clinic-section">
          <div className="clinic-card">
            <div className="clinic-card-header">
              <div className="clinic-card-icon">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>clinical_notes</span>
              </div>
              <h2 className="clinic-card-title">Glass Skin Prescription</h2>
            </div>
            <div className="clinic-routines">
              <div className="clinic-routine">
                <h3 className="clinic-routine-label">Morning Routine</h3>
                <p className="clinic-routine-text">
                  Apply <strong>Watery Toner</strong> in 7 layers (7-Skin Method) to create deep hydration from within.
                </p>
              </div>
              <div className="clinic-routine clinic-routine-border">
                <h3 className="clinic-routine-label">Night Routine</h3>
                <p className="clinic-routine-text">
                  Transition to the <strong>10-Step K-Method</strong>. Focus on double cleansing and a fermentation-based essence.
                </p>
              </div>
            </div>
            <div className="clinic-tea-tip">
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>restaurant</span>
              <div>
                <h4 className="clinic-tea-title">Korean Tea Secret</h4>
                <p className="clinic-tea-desc">"Sip on Barley Tea (Bori-cha) daily to flush out toxins and boost internal glow."</p>
              </div>
            </div>
          </div>
        </section>

        {/* Curated Regimen - Navigation */}
        <section className="clinic-section-full">
          <div className="clinic-regimen-header">
            <h2 className="clinic-regimen-title">Curated Regimen</h2>
            <button className="clinic-see-steps">See Steps</button>
          </div>
          <div className="clinic-regimen-scroll">
            <div className="clinic-step-card" onClick={() => onNavigate('hairstyle')}>
              <div className="clinic-step-img-wrap">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGWW2vpQ7OZR2CcivasXemmVRu7L4plSUbxLDx9kj_Dncz3b4zM4MBjlBXfHA2t2mNKDurJDAGunTWGIll_KZJj615CqIY6XYuUUav246VEvUeFpNgdmd1zyYwPk5DAjPrRQl6QwTm3EjDbyHKwMFtPLV9mdwuKo38ic8Lpki_awri_q7ajitSWh5bSUCX_qAwdIZxScK7KTWA_aQiHdmkm46Pe8WlkSLjJSusCANCjic0mn_2sUQ5ENN4pY7cUVpIFo3pdCvKNavy" alt="Hair" className="clinic-step-img" />
                <div className="clinic-step-badge">STEP 1</div>
                {selections.hair && <div className="clinic-step-check"><span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span></div>}
              </div>
              <div className="clinic-step-info">
                <span className="clinic-step-category">Hairstyle</span>
                <span className="clinic-step-name">{t(lang, 'hairNav')}</span>
              </div>
            </div>

            <div className="clinic-step-card" onClick={() => onNavigate('makeup')}>
              <div className="clinic-step-img-wrap">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBvUO2BLqTkKwq-qbPFhXTLUdXX9s6ZeKsoT2Nt6COuJqALRRzGSN6k5akSfzPLoc1HafPj2FWpIr6IfdIT_cus5yM9HWqRlT4L4qPplNe3_mb9fC6cJvd2KqXMxrvSVZCZXdov7m3-wlTVagBJd1eJdXPhPBV3QueIwM074Sjf_3q9jYc6Okh3KfhwChBVcH8hPqmBJgWD9UIAReFZLLCL6VKHMJFr8nPCpfAkIYqZ1ucb40Jn9iUpy_BTJRQuMWqvoSSDyGf-FN7D" alt="Makeup" className="clinic-step-img" />
                <div className="clinic-step-badge">STEP 2</div>
                {selections.makeup && <div className="clinic-step-check"><span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span></div>}
              </div>
              <div className="clinic-step-info">
                <span className="clinic-step-category">Makeup</span>
                <span className="clinic-step-name">{t(lang, 'makeupNav')}</span>
              </div>
            </div>

            <div className="clinic-step-card" onClick={() => onNavigate('diet')}>
              <div className="clinic-step-img-wrap">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCECFqsdbzlU_Cf0WFdeW8lKQ14SqWDyXojNjFVKAJvD-E9AjKl5VYwrDbdAp0zaPW50h8ljmDdOUr-OU5YaA-WP-Bp_N39SqnuK9uoegaAaGHFzd3tX8OGqP40c7nFRh_7EQqJUWs-yfaWPQf0XtfvCB7eT1whf6xSs0WS77UoyD0aATuZ4LdAxvLW3sPMgmzqKivYBA4NK2Td9PahXLeEobfy4p0s9t4MMtIcmTy7MPgt0qdP18ctwtl0ecVXd_V2RxvGzR83lv1S" alt="Diet" className="clinic-step-img" />
                <div className="clinic-step-badge">DIET</div>
                {selections.diet && <div className="clinic-step-check"><span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span></div>}
              </div>
              <div className="clinic-step-info">
                <span className="clinic-step-category">Nutrition</span>
                <span className="clinic-step-name">{t(lang, 'dietNav')}</span>
              </div>
            </div>

            <div className="clinic-step-card" onClick={() => onNavigate('fashion')}>
              <div className="clinic-step-img-wrap">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBoX81TUDrvaNkoTaEosc1L7RAZ7rOcl_UCgojWArBvHE9d8DDK70XtV2wpKcGCTPhxP5UJtmXy0z4KGG6nFdBFaOPOGFoD6MGWq1PAr4-Gr3futl6p-aALxnbF_Ublri6HUrnx5FEe9RcbmM064yAsKJHBqua9Lp0Oq6_vS4Eb--Oamuo74b1IzOv8vFt0NBxecfwOcMmBFGGgTsqh7UN-4hYQdKxsbI54fP11u72lfemL5iR5XbVHrEadPpJklY-VCzpN7BEfd7oH" alt="Fashion" className="clinic-step-img" />
                <div className="clinic-step-badge">STEP 3</div>
                {selections.fashion && <div className="clinic-step-check"><span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span></div>}
              </div>
              <div className="clinic-step-info">
                <span className="clinic-step-category">Fashion</span>
                <span className="clinic-step-name">{t(lang, 'fashionNav')}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Analysis Score */}
        <section className="clinic-section">
          <div className="clinic-score-bar">
            <div className="clinic-score-left">
              <p className="clinic-score-label">Analysis Score</p>
              <p className="clinic-score-value">
                {photoFile ? '—' : '—'}
                <span className="clinic-score-max">/100</span>
              </p>
            </div>
            <div className="clinic-score-divider" />
            <div className="clinic-score-right">
              <p className="clinic-score-label" style={{ textAlign: 'right' }}>Texture Level</p>
              <div className="clinic-texture-dots">
                <div className="clinic-dot clinic-dot-active" />
                <div className="clinic-dot clinic-dot-active" />
                <div className="clinic-dot clinic-dot-active" />
                <div className="clinic-dot" />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Bottom CTA */}
      <div className="clinic-bottom-cta">
        <div className="clinic-bottom-inner">
          <button className="clinic-start-btn" disabled={!photoFile} onClick={onSubmit}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>face_retouching_natural</span>
            <span>{t(lang, 'analyzeSkin')}</span>
          </button>
          {selectedCount > 0 && (
            <button className="clinic-share-btn" onClick={() => onNavigate('final')}>
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>star</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default PhotoUpload
