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
      return;
    }
    
    // Cancel any ongoing speech
    stopSpeaking();
    
    // Create a new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;
    
    // Set utterance properties
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // Set up event handlers
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };
    
    // Start speaking
    speechSynthRef.current.speak(utterance);
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
