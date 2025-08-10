import React, { useState } from 'react';
import { FeedbackModal } from './FeedbackModal';

export function FloatingFeedbackButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const feedbackWidgetStyle: React.CSSProperties = {
    position: 'fixed',
    right: '20px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
    color: 'white',
    padding: '20px 16px',
    borderRadius: '12px 0 0 12px',
    writingMode: 'vertical-rl' as any,
    textOrientation: 'mixed' as any,
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 600,
    zIndex: 999,
    transition: 'all 0.3s ease',
    boxShadow: '-4px 0 20px rgba(239, 68, 68, 0.3)',
    letterSpacing: '1px',
  };

  const feedbackWidgetHoverStyle: React.CSSProperties = {
    ...feedbackWidgetStyle,
    background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
    transform: 'translateY(-50%) translateX(-8px)',
    boxShadow: '-8px 0 25px rgba(239, 68, 68, 0.4)',
  };

  return (
    <>
      <div 
        style={feedbackWidgetStyle}
        onClick={() => setIsModalOpen(true)}
        onMouseEnter={(e) => {
          Object.assign(e.currentTarget.style, {
            background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
            transform: 'translateY(-50%) translateX(-8px)',
            boxShadow: '-8px 0 25px rgba(239, 68, 68, 0.4)',
          });
        }}
        onMouseLeave={(e) => {
          Object.assign(e.currentTarget.style, {
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            transform: 'translateY(-50%)',
            boxShadow: '-4px 0 20px rgba(239, 68, 68, 0.3)',
          });
        }}
      >
        💬 Feedback
      </div>

      <FeedbackModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}