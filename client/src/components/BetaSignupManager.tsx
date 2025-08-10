import React, { useState, useEffect } from 'react';
import { BetaSignupModal } from './BetaSignupModal';

export function BetaSignupManager() {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Check if user has already seen the modal
    const hasSeenModal = localStorage.getItem('betaSignupModalSeen');
    
    if (!hasSeenModal) {
      // Show modal after 1 second delay
      const timer = setTimeout(() => {
        setShowModal(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleCloseModal = () => {
    setShowModal(false);
    // Mark as seen so it doesn't show again
    localStorage.setItem('betaSignupModalSeen', 'true');
  };

  return (
    <BetaSignupModal 
      isOpen={showModal} 
      onClose={handleCloseModal} 
    />
  );
}