import { useState, useEffect, useRef } from 'react';

interface TextToSpeechHook {
  speak: (text: string) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
}

export function useTextToSpeech(): TextToSpeechHook {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const speechSynthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthRef.current = window.speechSynthesis;
    }
    
    return () => {
      if (speechSynthRef.current) {
        speechSynthRef.current.cancel();
      }
    };
  }, []);
  
  // Function to speak text
  const speak = (text: string) => {
    if (!speechSynthRef.current) {
      console.error('Speech synthesis not supported');
      return;
    }
    
    // Cancel any ongoing speech
    stopSpeaking();
    
    // Wait a moment for the cancel to take effect
    setTimeout(() => {
      // Create a new utterance
      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;
      
      // Set utterance properties
      utterance.rate = 0.9; // Slightly slower than default for better comprehension
      utterance.pitch = 1;
      utterance.volume = 1;
      
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
        };
        
        utterance.onend = () => {
          setIsSpeaking(false);
          setIsPaused(false);
        };
        
        utterance.onerror = (event) => {
          console.error('Speech synthesis error:', event);
          setIsSpeaking(false);
          setIsPaused(false);
          
          // Try again with default voice
          if (utterance.voice) {
            utterance.voice = null;
            speechSynthRef.current!.speak(utterance);
          }
        };
        
        // Start speaking
        try {
          speechSynthRef.current!.speak(utterance);
        } catch (error) {
          console.error('Failed to start speech synthesis:', error);
          setIsSpeaking(false);
          setIsPaused(false);
        }
      };
      
      // Check if voices are loaded
      const voices = speechSynthRef.current.getVoices();
      if (voices.length === 0) {
        // Wait for voices to load
        speechSynthRef.current.addEventListener('voiceschanged', setVoiceAndSpeak, { once: true });
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
  
  return {
    speak,
    stopSpeaking,
    isSpeaking,
    isPaused
  };
}
