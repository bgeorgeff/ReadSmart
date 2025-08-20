import React, { useState } from 'react';
import { FeedbackModal } from './FeedbackModal';

export function FloatingFeedbackButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const feedbackWidgetStyle: React.CSSProperties = {
    position: 'fixed',
    right: '0px',
    bottom: '120px',
    background: 'linear-gradient(135deg, #fbbf24, #f97316, #ef4444)',
    color: 'white',
    padding: '8px 12px',
    borderRadius: '8px 0 0 8px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 600,
    zIndex: 50,
    transition: 'all 0.3s ease',
    boxShadow: '-2px 0 10px rgba(239, 68, 68, 0.2)',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  };

  const feedbackWidgetHoverStyle: React.CSSProperties = {
    ...feedbackWidgetStyle,
    background: 'linear-gradient(135deg, #f59e0b, #ea580c, #dc2626)',
    transform: 'translateX(-4px)',
    boxShadow: '-4px 0 15px rgba(239, 68, 68, 0.3)',
  };

  return (
    <>
      <div 
        style={feedbackWidgetStyle}
        onClick={() => setIsModalOpen(true)}
        onMouseEnter={(e) => {
          Object.assign(e.currentTarget.style, {
            background: 'linear-gradient(135deg, #f59e0b, #ea580c, #dc2626)',
            transform: 'translateX(-4px)',
            boxShadow: '-4px 0 15px rgba(239, 68, 68, 0.3)',
          });
        }}
        onMouseLeave={(e) => {
          Object.assign(e.currentTarget.style, {
            background: 'linear-gradient(135deg, #fbbf24, #f97316, #ef4444)',
            transform: 'translateX(0px)',
            boxShadow: '-2px 0 10px rgba(239, 68, 68, 0.2)',
          });
        }}
      >
        💬
        <span style={{fontSize: '11px'}}>Feedback</span>
      </div>

      <FeedbackModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}