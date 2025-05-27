import { useState, useRef } from 'react';

// Helper function to detect iOS
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

// Helper function to check microphone permissions
const checkMicrophonePermission = async () => {
  if (!navigator.permissions) {
    return 'unknown';
  }
  
  try {
    const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    return permission.state;
  } catch (error) {
    console.log('Permission query not supported:', error);
    return 'unknown';
  }
};

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      setRecordingTime(0);
      setAudioUrl(null);
      
      // Check if MediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Audio recording is not supported in this browser');
      }

      // Check permissions first
      const permissionState = await checkMicrophonePermission();
      console.log('Microphone permission state:', permissionState);
      
      if (permissionState === 'denied') {
        throw new Error('Microphone permission was denied. Please enable microphone access in your browser settings.');
      }

      // Enhanced constraints for mobile devices, especially iOS
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // iOS-specific optimizations
          ...(isIOS() && {
            sampleRate: { ideal: 44100 },
            channelCount: { ideal: 1 },
            latency: { ideal: 0.2 }
          })
        }
      };

      console.log('Requesting microphone access with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Enhanced format detection for iOS/Safari compatibility
      let options = {};
      if (MediaRecorder.isTypeSupported('audio/mp4')) {
        // Prefer MP4 for iOS compatibility
        options = { mimeType: 'audio/mp4' };
      } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options = { mimeType: 'audio/webm;codecs=opus' };
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/webm' };
      } else if (MediaRecorder.isTypeSupported('audio/wav')) {
        options = { mimeType: 'audio/wav' };
      }
      
      mediaRecorder.current = new MediaRecorder(stream, options);
      console.log('Recording with format:', mediaRecorder.current.mimeType);
      console.log('Audio constraints:', constraints);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
          console.log('Audio chunk received, size:', event.data.size);
        }
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { 
          type: mediaRecorder.current?.mimeType || 'audio/mp4' 
        });
        console.log('Recording complete, blob size:', audioBlob.size);
        console.log('Audio blob type:', audioBlob.type);
        
        if (audioBlob.size === 0) {
          console.error('Recording failed - empty audio blob');
          throw new Error('No audio was recorded. This could be due to permission issues or browser limitations.');
        }
        
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
      };

      mediaRecorder.current.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        throw new Error('Recording failed due to an internal error');
      };

      // Start recording with a small timeslice for better mobile performance
      mediaRecorder.current.start(1000);
      setIsRecording(true);

      recordingTimer.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
      
      console.log('Recording started successfully');
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
      
      // Clean up any resources
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }
      
      // Re-throw the error to be handled by the UI
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
    playbackDuration
  };
}