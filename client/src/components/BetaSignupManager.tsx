import React, { useState, useEffect } from 'react';
import { BetaSignupModal } from './BetaSignupModal';
import { EmailAuthModal } from './EmailAuthModal';
import { useLocation } from 'wouter';

export function BetaSignupManager() {
  const [showModal, setShowModal] = useState(false);
  const [showEmailAuth, setShowEmailAuth] = useState(false);
  const [, navigate] = useLocation();

  useEffect(() => {
    // Listen for custom events
    const handleShowBetaSignup = () => {
      setShowModal(true);
    };

    const handleShowEmailAuth = () => {
      setShowEmailAuth(true);
    };

    window.addEventListener('show-beta-signup', handleShowBetaSignup);
    window.addEventListener('show-email-auth', handleShowEmailAuth);
    
    return () => {
      window.removeEventListener('show-beta-signup', handleShowBetaSignup);
      window.removeEventListener('show-email-auth', handleShowEmailAuth);
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

  const handleEmailVerified = (email: string) => {
    // User verified their email, take them to the app
    navigate('/app');
  };

  return (
    <>
      <BetaSignupModal 
        isOpen={showModal} 
        onClose={handleCloseModal}
        onSuccess={handleSuccessfulSignup}
      />
      <EmailAuthModal
        isOpen={showEmailAuth}
        onClose={() => setShowEmailAuth(false)}
        onVerified={handleEmailVerified}
      />
    </>
  );
}