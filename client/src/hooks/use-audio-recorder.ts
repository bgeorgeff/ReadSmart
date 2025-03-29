import { useState, useRef, useEffect } from 'react';

interface AudioRecorderHook {
  isRecording: boolean;
  recordingTime: number;
  audioUrl: string | null;
  startRecording: () => void;
  stopRecording: () => void;
  resetRecording: () => void;
  playRecording: () => void;
  isPlaying: boolean;
  playbackProgress: number;
  playbackDuration: number;
}

export function useAudioRecorder(): AudioRecorderHook {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Setup audio element for playback
  useEffect(() => {
    const audioElement = new Audio();
    audioRef.current = audioElement;
    
    audioElement.addEventListener('timeupdate', () => {
      setPlaybackProgress(audioElement.currentTime);
    });
    
    audioElement.addEventListener('loadedmetadata', () => {
      setPlaybackDuration(audioElement.duration);
    });
    
    audioElement.addEventListener('play', () => {
      setIsPlaying(true);
    });
    
    audioElement.addEventListener('pause', () => {
      setIsPlaying(false);
    });
    
    audioElement.addEventListener('ended', () => {
      setIsPlaying(false);
      setPlaybackProgress(0);
    });
    
    return () => {
      audioElement.pause();
      audioElement.src = '';
      
      audioElement.removeEventListener('timeupdate', () => {});
      audioElement.removeEventListener('loadedmetadata', () => {});
      audioElement.removeEventListener('play', () => {});
      audioElement.removeEventListener('pause', () => {});
      audioElement.removeEventListener('ended', () => {});
    };
  }, []);
  
  // Start recording
  const startRecording = async () => {
    try {
      // Reset previous recording
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      
      audioChunksRef.current = [];
      setRecordingTime(0);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        if (audioRef.current) {
          audioRef.current.src = url;
        }
        
        // Stop all tracks in the stream
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
      // Start timer
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };
  
  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };
  
  // Reset recording
  const resetRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    
    setAudioUrl(null);
    setRecordingTime(0);
    setPlaybackProgress(0);
    setPlaybackDuration(0);
    setIsPlaying(false);
    audioChunksRef.current = [];
  };
  
  // Play/pause recording
  const playRecording = () => {
    if (audioRef.current && audioUrl) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };
  
  return {
    isRecording,
    recordingTime,
    audioUrl,
    startRecording,
    stopRecording,
    resetRecording,
    playRecording,
    isPlaying,
    playbackProgress,
    playbackDuration
  };
}
