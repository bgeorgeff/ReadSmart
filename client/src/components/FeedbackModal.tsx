import React, { useState } from 'react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [email, setEmail] = useState('');
  const [feedbackType, setFeedbackType] = useState('');
  const [message, setMessage] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    if (!message || message.trim().length < 10) {
      alert('Please provide at least 10 characters in your message');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_email: email,
          feedback_type: feedbackType || 'General Feedback',
          message: message.trim(),
          has_screenshot: !!screenshot,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Thank you for your feedback! We\'ve received your message.');
        // Reset form
        setEmail('');
        setFeedbackType('');
        setMessage('');
        setScreenshot(null);
        onClose();
      } else {
        alert(data.message || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      alert('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Please select a file smaller than 5MB');
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      setScreenshot(file);
    }
  };

  const clearScreenshot = () => {
    setScreenshot(null);
  };

  if (!isOpen) return null;

  return (
    <div className="popup-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="popup-modal" style={{maxWidth: '520px'}}>
        <button className="close-btn" onClick={onClose}>&times;</button>
        
        <div className="popup-header">
          <div className="popup-icon">💬</div>
          <h2 className="popup-title">Send Feedback</h2>
          <p className="popup-subtitle">Help us improve by sharing your thoughts, reporting bugs, or suggesting features</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{marginBottom: '20px'}}>
            <label style={{display: 'block', fontWeight: 600, marginBottom: '8px', color: '#374151'}}>
              Email Address
            </label>
            <input 
              type="email" 
              className="email-input" 
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{marginBottom: 0}}
            />
          </div>

          <div style={{marginBottom: '20px'}}>
            <label style={{display: 'block', fontWeight: 600, marginBottom: '8px', color: '#374151'}}>
              Feedback Type
            </label>
            <select 
              className="email-input" 
              value={feedbackType}
              onChange={(e) => setFeedbackType(e.target.value)}
              required
              style={{marginBottom: 0}}
            >
              <option value="">Select feedback type</option>
              <option value="Bug Report">🐛 Bug Report</option>
              <option value="Feature Request">✨ Feature Request</option>
              <option value="General Feedback">💭 General Feedback</option>
            </select>
          </div>

          <div style={{marginBottom: '20px'}}>
            <label style={{display: 'block', fontWeight: 600, marginBottom: '8px', color: '#374151'}}>
              Details
            </label>
            <textarea 
              className="email-input" 
              placeholder="Please describe your feedback in detail..."
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              style={{marginBottom: 0, resize: 'vertical', minHeight: '100px'}}
            />
          </div>

          <div style={{marginBottom: '24px'}}>
            <label style={{display: 'block', fontWeight: 600, marginBottom: '8px', color: '#374151'}}>
              Screenshot (Optional)
            </label>
            <input 
              type="file" 
              id="screenshotInput"
              accept="image/*"
              onChange={handleFileChange}
              style={{display: 'none'}}
            />
            {!screenshot ? (
              <button 
                type="button" 
                onClick={() => document.getElementById('screenshotInput')?.click()}
                className="screenshot-btn"
              >
                📎 Click to attach screenshot
              </button>
            ) : (
              <div className="screenshot-preview">
                <span style={{fontSize: '14px', color: '#666'}}>{screenshot.name}</span>
                <button type="button" onClick={clearScreenshot} className="remove-btn">&times;</button>
              </div>
            )}
          </div>

          <button type="submit" className="cta-button" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Feedback'}
          </button>
        </form>
      </div>


    </div>
  );
}