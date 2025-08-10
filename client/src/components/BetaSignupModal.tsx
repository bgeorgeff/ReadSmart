import React, { useState } from 'react';

interface BetaSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BetaSignupModal({ isOpen, onClose }: BetaSignupModalProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      alert('Please enter a valid email address');
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
        // Use only our custom message, ignore server message completely
        alert("Thank you for joining our beta program! Check your email for next steps.");
        setEmail('');
        onClose();
      } else {
        alert('Something went wrong. Please try again.');
      }
    } catch (error) {
      alert('Network error. Please check your connection and try again.');
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
          <div className="popup-icon">🚀</div>
          <h2 className="popup-title">Join Our Beta Program</h2>
          <p className="popup-subtitle">Be the first to experience our new platform and help shape its future!</p>
        </div>

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

        <form className="email-form" onSubmit={handleSubmit}>
          <input 
            type="email" 
            className="email-input" 
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" className="cta-button" disabled={isLoading}>
            {isLoading ? 'Joining...' : 'Get Free Beta Access'}
          </button>
        </form>

        <p className="disclaimer">
          We'll only email you about beta updates and your exclusive launch discount. No spam, unsubscribe anytime.
        </p>
      </div>


    </div>
  );
}