import { useState, useEffect, useRef } from 'react';

interface TextToSpeechHook {
  speak: (text: string, onWordHighlight?: (wordIndex: number) => void) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  currentWordIndex: number;
}

export function useTextToSpeech(): TextToSpeechHook {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const speechSynthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const wordHighlightCallback = useRef<((wordIndex: number) => void) | null>(null);
  const wordsRef = useRef<string[]>([]);
  const wordTimerRef = useRef<NodeJS.Timeout | null>(null);
  
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
  const speak = (text: string, onWordHighlight?: (wordIndex: number) => void) => {
    if (!speechSynthRef.current) {
      console.error('Speech synthesis not supported');
      return;
    }
    
    // Cancel any ongoing speech
    stopSpeaking();
    
    // Store callback and prepare words
    wordHighlightCallback.current = onWordHighlight || null;
    wordsRef.current = text.split(/\s+/).filter(word => word.trim() !== '');
    setCurrentWordIndex(-1);
    
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
          setCurrentWordIndex(-1);
          
          // Start word highlighting if callback is provided
          if (wordHighlightCallback.current && wordsRef.current.length > 0) {
            startWordHighlighting();
          }
        };
        
        utterance.onend = () => {
          setIsSpeaking(false);
          setIsPaused(false);
          setCurrentWordIndex(-1);
          if (wordTimerRef.current) {
            clearTimeout(wordTimerRef.current);
            wordTimerRef.current = null;
          }
        };
        
        utterance.onerror = () => {
          setIsSpeaking(false);
          setIsPaused(false);
          setCurrentWordIndex(-1);
          if (wordTimerRef.current) {
            clearTimeout(wordTimerRef.current);
            wordTimerRef.current = null;
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
  
  // Function to start word highlighting
  const startWordHighlighting = () => {
    if (!wordHighlightCallback.current || wordsRef.current.length === 0) return;
    
    const wordsPerMinute = 150; // Average reading speed
    const millisecondsPerWord = (60 * 1000) / wordsPerMinute;
    
    let wordIndex = 0;
    
    const highlightNextWord = () => {
      if (wordIndex < wordsRef.current.length && isSpeaking) {
        setCurrentWordIndex(wordIndex);
        if (wordHighlightCallback.current) {
          wordHighlightCallback.current(wordIndex);
        }
        
        wordIndex++;
        wordTimerRef.current = setTimeout(highlightNextWord, millisecondsPerWord);
      }
    };
    
    // Start highlighting after a small delay
    wordTimerRef.current = setTimeout(highlightNextWord, 500);
  };
  
  // Function to stop speaking
  const stopSpeaking = () => {
    if (speechSynthRef.current) {
      speechSynthRef.current.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentWordIndex(-1);
    }
    
    if (wordTimerRef.current) {
      clearTimeout(wordTimerRef.current);
      wordTimerRef.current = null;
    }
  };
  
  return {
    speak,
    stopSpeaking,
    isSpeaking,
    isPaused,
    currentWordIndex
  };
}
