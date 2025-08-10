import React, { useState, useEffect } from 'react';
import { BetaSignupModal } from './BetaSignupModal';

export function BetaSignupManager() {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Listen for custom event to show beta signup modal
    const handleShowBetaSignup = () => {
      setShowModal(true);
    };

    window.addEventListener('show-beta-signup', handleShowBetaSignup);
    
    return () => {
      window.removeEventListener('show-beta-signup', handleShowBetaSignup);
    };
  }, []);

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleSuccessfulSignup = () => {
    // Mark user as signed up in localStorage
    localStorage.setItem('betaSignupCompleted', 'true');
    setShowModal(false);
  };

  return (
    <BetaSignupModal 
      isOpen={showModal} 
      onClose={handleCloseModal}
      onSuccess={handleSuccessfulSignup}
    />
  );
}