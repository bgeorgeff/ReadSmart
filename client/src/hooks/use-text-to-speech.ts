import { useState, useEffect, useRef } from 'react';

interface TextToSpeechHook {
  speak: (text: string, onWordHighlight?: (wordIndex: number) => void, rate?: number) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
}

// Simple tokenization function to match the one used in DisplayTextWithFixes
const tokenizeText = (text: string): string[] => {
  return text.split(/\s+/).filter(token => token.trim() !== '');
};

// Estimate word timing based on speech rate and word complexity
const estimateWordDuration = (word: string, rate: number): number => {
  // Base duration per character (in milliseconds) - more conservative estimate
  const baseCharDuration = 90; // milliseconds per character at 1x speed
  
  // Adjust for speech rate
  const adjustedCharDuration = baseCharDuration / rate;
  
  // Clean word for analysis (remove punctuation)
  const cleanWord = word.replace(/[.,!?;:"'()]/g, '');
  
  // Calculate base duration based on word length with minimum
  const wordDuration = Math.max(300, cleanWord.length * adjustedCharDuration);
  
  // Add extra time for punctuation and complex words
  let extraTime = 0;
  
  // Punctuation pauses
  if (word.includes('.') || word.includes('!') || word.includes('?')) {
    extraTime += 300; // Longer pause for sentence endings
  } else if (word.includes(',') || word.includes(';') || word.includes(':')) {
    extraTime += 200; // Medium pause for commas and semicolons
  }
  
  // Complex word adjustments
  if (cleanWord.length > 8) {
    extraTime += 150; // Extra time for longer words
  }
  
  // Syllable-based adjustment (rough estimate)
  const syllableCount = Math.max(1, Math.ceil(cleanWord.length / 3));
  const syllableAdjustment = syllableCount * 50;
  
  // Device-specific timing adjustments
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  let deviceMultiplier = 1.0;
  
  // Android devices tend to have slightly different timing
  if (userAgent.includes('Android')) {
    deviceMultiplier = 1.15;
  }
  // Windows devices may need slight adjustment
  else if (userAgent.includes('Windows')) {
    deviceMultiplier = 1.05;
  }
  // iOS Safari tends to be more consistent
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    deviceMultiplier = 0.95;
  }
  
  return Math.round((wordDuration + extraTime + syllableAdjustment) * deviceMultiplier);
};

export function useTextToSpeech(): TextToSpeechHook {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const speechSynthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const highlightingTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const currentHighlightCallbackRef = useRef<((wordIndex: number) => void) | null>(null);
  
  // Initialize speech synthesis only when needed (not on component mount)
  const initializeSpeechSynthesis = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && !speechSynthRef.current) {
      speechSynthRef.current = window.speechSynthesis;
    }
  };
  
  // Clear all highlighting timeouts
  const clearHighlightingTimeouts = () => {
    highlightingTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    highlightingTimeoutsRef.current = [];
  };
  
  // Function to speak text with optional word highlighting and custom rate
  const speak = (text: string, onWordHighlight?: (wordIndex: number) => void, rate: number = 0.9) => {
    // Initialize only when actually needed
    initializeSpeechSynthesis();
    
    if (!speechSynthRef.current) {
      console.error('Speech synthesis not supported');
      return;
    }
    
    // Cancel any ongoing speech and clear previous timeouts
    stopSpeaking();
    
    // Store the callback for potential cleanup
    currentHighlightCallbackRef.current = onWordHighlight || null;
    
    // Wait a moment for the cancel to take effect
    setTimeout(() => {
      // Create a new utterance
      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;
      
      // Set utterance properties
      utterance.rate = rate;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      // Tokenize text for timing-based highlighting
      const words = tokenizeText(text);
      
      // Wait for voices to load if they haven't already
      const setVoiceAndSpeak = () => {
        const voices = speechSynthRef.current!.getVoices();
        if (voices.length > 0) {
          // Try to use a natural-sounding English voice
          const englishVoices = voices.filter(voice => 
            voice.lang.startsWith('en-') && !voice.name.includes('Google')
          );
          
          if (englishVoices.length > 0) {
            utterance.voice = englishVoices[0];
          }
        }
        
        // Set up event handlers
        utterance.onstart = () => {
          setIsSpeaking(true);
          
          // Start timing-based word highlighting if callback provided
          if (onWordHighlight && words.length > 0) {
            // Small initial delay to account for speech startup
            let cumulativeDelay = 250;
            
            // Schedule highlighting for each word
            words.forEach((word, index) => {
              const timeout = setTimeout(() => {
                // Only highlight if we're still speaking and callback is still valid
                if (currentHighlightCallbackRef.current) {
                  currentHighlightCallbackRef.current(index);
                }
              }, cumulativeDelay);
              
              highlightingTimeoutsRef.current.push(timeout);
              
              // Add this word's estimated duration to the cumulative delay
              cumulativeDelay += estimateWordDuration(word, rate);
            });
            
            // Schedule clearing the highlight after the last word
            const finalTimeout = setTimeout(() => {
              if (currentHighlightCallbackRef.current) {
                currentHighlightCallbackRef.current(-1);
              }
            }, cumulativeDelay + 200);
            
            highlightingTimeoutsRef.current.push(finalTimeout);
          }
        };
        
        utterance.onend = () => {
          setIsSpeaking(false);
          setIsPaused(false);
          clearHighlightingTimeouts();
          if (currentHighlightCallbackRef.current) {
            currentHighlightCallbackRef.current(-1); // Clear highlighting
          }
          currentHighlightCallbackRef.current = null;
        };
        
        utterance.onerror = () => {
          setIsSpeaking(false);
          setIsPaused(false);
          clearHighlightingTimeouts();
          if (currentHighlightCallbackRef.current) {
            currentHighlightCallbackRef.current(-1); // Clear highlighting
          }
          currentHighlightCallbackRef.current = null;
        };
        
        // Start speaking
        try {
          speechSynthRef.current!.speak(utterance);
        } catch (error) {
          console.error('Failed to start speech synthesis:', error);
          setIsSpeaking(false);
          setIsPaused(false);
          clearHighlightingTimeouts();
          if (currentHighlightCallbackRef.current) {
            currentHighlightCallbackRef.current(-1);
          }
          currentHighlightCallbackRef.current = null;
        }
      };
      
      // Check if voices are loaded
      const voices = speechSynthRef.current!.getVoices();
      if (voices.length === 0) {
        // Wait for voices to load
        speechSynthRef.current!.addEventListener('voiceschanged', setVoiceAndSpeak, { once: true });
        // Fallback timeout in case voiceschanged doesn't fire
        setTimeout(setVoiceAndSpeak, 100);
      } else {
        setVoiceAndSpeak();
      }
    }, 100);
  };
  
  // Function to stop speaking
  const stopSpeaking = () => {
    if (speechSynthRef.current) {
      speechSynthRef.current.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
    // Clear all highlighting timeouts and callback
    clearHighlightingTimeouts();
    if (currentHighlightCallbackRef.current) {
      currentHighlightCallbackRef.current(-1);
    }
    currentHighlightCallbackRef.current = null;
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  return {
    speak,
    stopSpeaking,
    isSpeaking,
    isPaused
  };
}
