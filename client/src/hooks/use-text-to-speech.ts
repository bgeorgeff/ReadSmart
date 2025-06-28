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
        
        // Use the standard boundary event for word highlighting
        if (onWordHighlight) {
          let wordIndex = 0;
          utterance.onboundary = (event) => {
            if (event.name === 'word') {
              onWordHighlight(wordIndex);
              wordIndex++;
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