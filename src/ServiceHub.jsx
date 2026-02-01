import { t } from './i18n'

function ServiceHub({ lang, userName, photo, onNavigate }) {
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

      {/* Transformation Banner */}
      <div className="hub-banner-wrap">
        <div className="hub-banner">
          {photo && (
            <img src={photo} alt="Current" className="hub-banner-bg" />
          )}
          <div className="hub-banner-overlay" />
          {/* Tags */}
          <div className="hub-banner-tags">
            <div className="hub-banner-half">
              <span className="hub-tag-dark">{t(lang, 'hubCurrent')}</span>
            </div>
            <div className="hub-banner-half hub-banner-half-right">
              <span className="hub-tag-pink">{t(lang, 'hubAiTarget')}</span>
            </div>
          </div>
          {/* Center badge */}
          <div className="hub-banner-center">
            <div className="hub-styling-badge">
              <span className="material-symbols-outlined hub-spin" style={{ fontSize: 14 }}>auto_fix_high</span>
              <p>{t(lang, 'hubStylingProgress')}</p>
            </div>
          </div>
          {/* Bottom text */}
          <div className="hub-banner-bottom">
            <p className="hub-banner-title">{t(lang, 'hubEvolution')}</p>
            <p className="hub-banner-sub">{t(lang, 'hubProcessing')}</p>
          </div>
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
            <span className="material-symbols-outlined" style={{ fontSize: 28 }}>auto_awesome</span>
          </div>
          <div className="hub-card-text">
            <h2 className="hub-card-title">{t(lang, 'hubSkin')}</h2>
            <p className="hub-card-sub hub-sub-pink">{t(lang, 'hubSkinSub')}</p>
          </div>
        </div>

        {/* Hair Style */}
        <div className="hub-card" onClick={() => onNavigate('hairstyle')}>
          <div className="hub-card-icon hub-icon-blue">
            <span className="material-symbols-outlined" style={{ fontSize: 28 }}>content_cut</span>
          </div>
          <div className="hub-card-text">
            <h2 className="hub-card-title">{t(lang, 'hubHair')}</h2>
            <p className="hub-card-sub hub-sub-blue">{t(lang, 'hubHairSub')}</p>
          </div>
        </div>

        {/* K-Fit Routine */}
        <div className="hub-card" onClick={() => onNavigate('diet')}>
          <div className="hub-card-icon hub-icon-green">
            <span className="material-symbols-outlined" style={{ fontSize: 28 }}>ecg_heart</span>
          </div>
          <div className="hub-card-text">
            <h2 className="hub-card-title">{t(lang, 'hubDiet')}</h2>
            <p className="hub-card-sub hub-sub-green">{t(lang, 'hubDietSub')}</p>
          </div>
        </div>

        {/* K-Makeup */}
        <div className="hub-card" onClick={() => onNavigate('makeup')}>
          <div className="hub-card-icon hub-icon-purple">
            <span className="material-symbols-outlined" style={{ fontSize: 28 }}>palette</span>
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
