import { useState, useRef } from 'react';

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      setRecordingTime(0);
      setAudioUrl(null);
      setPermissionError(null);
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser doesn\'t support audio recording. Please try using a different browser.');
      }

      // Request microphone permission with better error handling
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { 
          type: mediaRecorder.current?.mimeType || 'audio/webm' 
        });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
      };

      mediaRecorder.current.start();
      setIsRecording(true);

      recordingTimer.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error: any) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
      
      // Provide specific error messages based on the type of error
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setPermissionError('Microphone access was denied. Please check your browser settings and allow microphone access for this website.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setPermissionError('No microphone found. Please make sure a microphone is connected and try again.');
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        setPermissionError('Microphone is being used by another application. Please close other apps using the microphone and try again.');
      } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
        setPermissionError('Microphone settings are not supported. Please try again.');
      } else if (error.name === 'NotSupportedError') {
        setPermissionError('Audio recording is not supported in this browser. Please try using Chrome, Firefox, or Safari.');
      } else {
        setPermissionError('Recording failed. Please check your microphone permissions and try again.');
      }
      
      throw error;
    }
  };

  const stopRecording = () => {
    if (recordingTimer.current) {
      clearInterval(recordingTimer.current);
      recordingTimer.current = null;
    }
    
    setIsRecording(false);
    
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const resetRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    
    setAudioUrl(null);
    setIsPlaying(false);
    setPlaybackProgress(0);
    setPlaybackDuration(0);
    audioChunks.current = [];
  };

  const playRecording = () => {
    if (!audioUrl) return;
    
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    // Create fresh audio element each time
    const audio = new Audio(audioUrl);
    console.log('Playing audio from URL:', audioUrl);
    
    audio.onloadedmetadata = () => {
      console.log('Audio loaded, duration:', audio.duration);
      setPlaybackDuration(audio.duration || 0);
    };
    
    audio.ontimeupdate = () => {
      setPlaybackProgress(audio.currentTime || 0);
    };
    
    audio.onended = () => {
      setIsPlaying(false);
      setPlaybackProgress(0);
    };
    
    audio.play()
      .then(() => {
        console.log('Audio started playing successfully');
        setIsPlaying(true);
      })
      .catch(error => {
        console.error('Failed to play audio:', error);
        setIsPlaying(false);
      });
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
    playbackDuration,
    permissionError
  };
}