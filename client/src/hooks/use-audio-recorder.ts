import { useState, useRef, useEffect } from 'react';

export function useAudioRecorder(): {
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
} {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);
  const audioElement = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioElement.current = new Audio();
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
        mimeType: 'audio/webm;codecs=opus'
      });

      audioChunks.current = [];
      setRecordingTime(0);
      setAudioUrl(null);

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm;codecs=opus' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        if (audioElement.current) {
          audioElement.current.src = url;
          audioElement.current.load();
        }

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.current.start();
      setIsRecording(true);

      recordingTimer.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
    }
  };

  const resetRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setRecordingTime(0);
    setIsPlaying(false);
    setPlaybackProgress(0);
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

  useEffect(() => {
    if (audioElement.current) {
      audioElement.current.onended = () => {
        setIsPlaying(false);
        setPlaybackProgress(0);
      };

      audioElement.current.ontimeupdate = () => {
        setPlaybackProgress(audioElement.current?.currentTime || 0);
      };
    }
  }, [audioUrl]);

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