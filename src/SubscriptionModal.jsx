import { useState } from 'react'
import { t } from './i18n'

function SubscriptionModal({ lang, onClose }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleCheckout = async () => {
    if (!email || !email.includes('@')) {
      setError(t(lang, 'subEmailRequired'))
      return
    }
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        setError(data.error || 'Checkout failed')
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="sub-modal-overlay" onClick={onClose}>
      <div className="sub-modal" onClick={(e) => e.stopPropagation()}>
        <button className="sub-modal-close" onClick={onClose}>&times;</button>

        <div className="sub-modal-badge">PREMIUM</div>
        <h2 className="sub-modal-title">{t(lang, 'subTitle')}</h2>
        <p className="sub-modal-price">
          <span className="sub-price-amount">$8.99</span>
          <span className="sub-price-period">/{t(lang, 'subMonth')}</span>
        </p>

        <ul className="sub-features">
          <li><span className="sub-check">✓</span> {t(lang, 'subFeatureSkin')}</li>
          <li><span className="sub-check">✓</span> {t(lang, 'subFeatureHair')}</li>
          <li><span className="sub-check">✓</span> {t(lang, 'subFeatureDiet')}</li>
          <li><span className="sub-check">✓</span> {t(lang, 'subFeatureMakeup')}</li>
          <li><span className="sub-check">✓</span> {t(lang, 'subFeatureFashion')}</li>
          <li><span className="sub-check">✓</span> {t(lang, 'subFeatureLimit')}</li>
        </ul>

        <input
          type="email"
          className="sub-email-input"
          placeholder={t(lang, 'subEmailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCheckout()}
        />

        {error && <p className="sub-error">{error}</p>}

        <button
          className="sub-cta-btn"
          onClick={handleCheckout}
          disabled={loading}
        >
          {loading ? t(lang, 'subProcessing') : t(lang, 'subSubscribe')}
        </button>

        <p className="sub-disclaimer">{t(lang, 'subDisclaimer')}</p>
      </div>
    </div>
  )
}

export default SubscriptionModal
