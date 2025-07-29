import { useState, useEffect, useRef } from 'react';

interface TextToSpeechHook {
  speak: (text: string, onWordHighlight?: (wordIndex: number) => void, rate?: number) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
}

export function useTextToSpeech(): TextToSpeechHook {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const speechSynthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  // Initialize speech synthesis only when needed
  const initializeSpeechSynthesis = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && !speechSynthRef.current) {
      speechSynthRef.current = window.speechSynthesis;
    }
  };
  
  // Function to speak text with optional word highlighting and custom rate
  const speak = (text: string, onWordHighlight?: (wordIndex: number) => void, rate: number = 0.9) => {
    initializeSpeechSynthesis();
    
    if (!speechSynthRef.current) {
      console.error('Speech synthesis not supported');
      return;
    }
    
    // Cancel any ongoing speech
    stopSpeaking();
    
    // Wait a moment for the cancel to take effect
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;
      
      // Set utterance properties
      utterance.rate = rate;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      // Setup voice selection
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
          // Immediately highlight the first word when speech begins
          if (onWordHighlight) {
            onWordHighlight(0);
          }
        };
        
        utterance.onend = () => {
          setIsSpeaking(false);
          setIsPaused(false);
          if (onWordHighlight) {
            onWordHighlight(-1); // Clear highlighting
          }
        };
        
        utterance.onerror = () => {
          setIsSpeaking(false);
          setIsPaused(false);
          if (onWordHighlight) {
            onWordHighlight(-1); // Clear highlighting
          }
        };
        
        // Use the industry-standard boundary event approach with character-position mapping
        if (onWordHighlight) {
          // Pre-tokenize the text exactly as it was working before - simple split method
          const tokens = text.split(/\s+/).filter(token => token.trim() !== '');
          const tokenMap: { start: number; end: number; index: number }[] = [];
          
          // Build a precise character-to-token mapping
          let searchStart = 0;
          for (let i = 0; i < tokens.length; i++) {
            const tokenStart = text.indexOf(tokens[i], searchStart);
            if (tokenStart !== -1) {
              tokenMap.push({
                start: tokenStart,
                end: tokenStart + tokens[i].length,
                index: i
              });
              searchStart = tokenStart + tokens[i].length;
            }
          }
          
          utterance.onboundary = (event) => {
            // Handle both 'word' and 'sentence' boundaries for better cross-browser compatibility
            if ((event.name === 'word' || event.name === 'sentence') && event.charIndex !== undefined) {
              const charIndex = event.charIndex;
              
              // Find the token that contains or is closest to this character position
              let bestMatch = -1;
              let bestDistance = Infinity;
              
              for (const token of tokenMap) {
                // Check if character index falls within token bounds
                if (charIndex >= token.start && charIndex < token.end) {
                  bestMatch = token.index;
                  break;
                }
                
                // Find closest token if no exact match
                const distance = Math.min(
                  Math.abs(charIndex - token.start),
                  Math.abs(charIndex - token.end)
                );
                
                if (distance < bestDistance) {
                  bestDistance = distance;
                  bestMatch = token.index;
                }
              }
              
              // Only highlight if we found a reasonable match
              if (bestMatch >= 0 && bestDistance < 50) { // Tolerance for speech engine variations
                onWordHighlight(bestMatch);
              }
            }
          };
        }
        
        // Start speaking
        try {
          speechSynthRef.current!.speak(utterance);
        } catch (error) {
          console.error('Failed to start speech synthesis:', error);
          setIsSpeaking(false);
          setIsPaused(false);
          if (onWordHighlight) {
            onWordHighlight(-1);
          }
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