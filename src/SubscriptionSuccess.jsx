import { useState, useEffect } from 'react'
import { t } from './i18n'

function SubscriptionSuccess({ lang, onComplete }) {
  const [status, setStatus] = useState('verifying')
  const [error, setError] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const checkoutId = params.get('checkout_id')

    if (!checkoutId) {
      setStatus('error')
      setError('No checkout ID')
      return
    }

    const verify = async () => {
      try {
        const res = await fetch('/api/verify-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checkoutId }),
        })
        const data = await res.json()

        if (data.customerId) {
          localStorage.setItem('beauty_customer_id', data.customerId)
          localStorage.setItem('beauty_sub_active', data.active ? '1' : '0')
          setStatus('success')
          // Clean URL
          window.history.replaceState({}, '', '/')
          setTimeout(() => onComplete(data.customerId, data.active), 2000)
        } else {
          setStatus('error')
          setError(data.error || 'Verification failed')
        }
      } catch (e) {
        setStatus('error')
        setError(e.message)
      }
    }

    verify()
  }, [onComplete])

  return (
    <div className="sub-success-page">
      <div className="home-bg" />
      {status === 'verifying' && (
        <>
          <div className="loader" />
          <p className="loading-text">{t(lang, 'subVerifying')}</p>
        </>
      )}
      {status === 'success' && (
        <div className="sub-success-content">
          <div className="sub-success-icon">✓</div>
          <h2>{t(lang, 'subSuccessTitle')}</h2>
          <p>{t(lang, 'subSuccessDesc')}</p>
        </div>
      )}
      {status === 'error' && (
        <div className="sub-success-content">
          <div className="sub-success-icon sub-error-icon">✕</div>
          <h2>{t(lang, 'subErrorTitle')}</h2>
          <p>{error}</p>
          <button className="sub-cta-btn" onClick={() => onComplete(null, false)}>
            {t(lang, 'backToHome')}
          </button>
        </div>
      )}
    </div>
  )
}

export default SubscriptionSuccess
