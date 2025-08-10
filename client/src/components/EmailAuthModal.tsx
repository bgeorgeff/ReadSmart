import React, { useState } from 'react';

interface EmailAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (email: string) => void;
}

export function EmailAuthModal({ isOpen, onClose, onVerified }: EmailAuthModalProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
      const response = await fetch('/api/check-beta-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success && data.isSignedUp) {
        // User is signed up, remember their email and let them access the app
        localStorage.setItem('userEmail', email);
        localStorage.setItem('betaSignupCompleted', 'true');
        onVerified(email);
        onClose();
      } else {
        setErrorMessage('This email is not registered for beta access. Please sign up first.');
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
          <div className="popup-icon">🔐</div>
          <h2 className="popup-title">Enter Your Email</h2>
          <p className="popup-subtitle">
            Please enter the email address you used to sign up for beta access.
          </p>
        </div>

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
            {isLoading ? 'Verifying...' : 'Access App'}
          </button>
        </form>

        <p className="disclaimer">
          Don't have beta access? Go back and click "Get Started" to sign up.
        </p>
      </div>
    </div>
  );
}