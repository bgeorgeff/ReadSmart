
import { useState, useRef, useEffect } from 'react';

export function useAudioRecorder() {
  // State hooks
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);

  // Ref hooks
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);
  const audioElement = useRef<HTMLAudioElement | null>(null);

  // Effect for audio element setup
  useEffect(() => {
    audioElement.current = new Audio();
    audioElement.current.onended = () => {
      setIsPlaying(false);
      setPlaybackProgress(0);
    };
    audioElement.current.ontimeupdate = () => {
      setPlaybackProgress(audioElement.current?.currentTime || 0);
    };

    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream, {
        mimeType: 'audio/wav'
      });
      audioChunks.current = [];
      setRecordingTime(0);
      
      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      mediaRecorder.current.start(1000);
      setIsRecording(true);

      recordingTimer.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  };

  const stopRecording = () => {
    if (!mediaRecorder.current) return;

    if (recordingTimer.current) {
      clearInterval(recordingTimer.current);
    }

    return new Promise<void>((resolve) => {
      mediaRecorder.current!.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        
        if (audioElement.current) {
          audioElement.current.src = url;
          audioElement.current.preload = 'metadata';
          
          audioElement.current.oncanplaythrough = () => {
            setPlaybackDuration(audioElement.current?.duration || 0);
            setAudioUrl(url);
          };
          
          audioElement.current.load();
        }

        mediaRecorder.current?.stream.getTracks().forEach(track => track.stop());
        resolve();
      };

      mediaRecorder.current!.stop();
      setIsRecording(false);
    });
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
    if (audioElement.current && audioUrl) {
      if (isPlaying) {
        audioElement.current.pause();
        setIsPlaying(false);
      } else {
        audioElement.current.play()
          .then(() => {
            setIsPlaying(true);
            setPlaybackDuration(audioElement.current?.duration || 0);
          })
          .catch(error => console.error('Error playing audio:', error));
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
