import React, { useState } from 'react';

interface BetaSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function BetaSignupModal({ isOpen, onClose, onSuccess }: BetaSignupModalProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/beta-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setShowSuccess(true);
        // Store the email for future authentication
        localStorage.setItem('userEmail', email);
        setEmail('');
        onSuccess?.();
      } else {
        setErrorMessage(data.message || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      setErrorMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="popup-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="popup-modal">
        <button className="close-btn" onClick={onClose}>&times;</button>
        
        <div className="popup-header">
          <div className="popup-icon">{showSuccess ? '✅' : '🚀'}</div>
          <h2 className="popup-title">{showSuccess ? 'Welcome to Beta!' : 'Join Our Beta Program'}</h2>
          <p className="popup-subtitle">
            {showSuccess 
              ? 'Thank you for joining our beta program! Please share your feedback to back the app better.' 
              : 'Be the first to experience our new platform and help shape its future!'
            }
          </p>
        </div>

        {!showSuccess && (
          <ul className="benefits-list">
            <li>
              <span className="checkmark">✓</span>
              Free access during entire beta period
            </li>
            <li>
              <span className="checkmark">✓</span>
              50% discount when we officially launch
            </li>
            <li>
              <span className="checkmark">✓</span>
              Direct input on features and improvements
            </li>
            <li>
              <span className="checkmark">✓</span>
              Priority customer support
            </li>
          </ul>
        )}

        {!showSuccess && (
          <form className="email-form" onSubmit={handleSubmit}>
            <input 
              type="email" 
              className="email-input" 
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {errorMessage && (
              <div style={{color: '#ef4444', fontSize: '14px', marginBottom: '12px'}}>
                {errorMessage}
              </div>
            )}
            <button type="submit" className="cta-button" disabled={isLoading}>
              {isLoading ? 'Joining...' : 'Get Free Beta Access'}
            </button>
          </form>
        )}

        {!showSuccess && (
          <p className="disclaimer">
            We'll only email you about beta updates and your exclusive launch discount. No spam, unsubscribe anytime.
          </p>
        )}
      </div>


    </div>
  );
}