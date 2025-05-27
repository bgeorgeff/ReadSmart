import { useState, useRef, useEffect } from 'react';

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
  const audioElement = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioElement.current = new Audio();
    audioElement.current.onended = () => {
      setIsPlaying(false);
      setPlaybackProgress(0);
    };
    audioElement.current.ontimeupdate = () => {
      setPlaybackProgress(audioElement.current?.currentTime || 0);
    };
    audioElement.current.onloadedmetadata = () => {
      setPlaybackDuration(audioElement.current?.duration || 0);
    };
  }, []);

  const startRecording = async () => {
    try {
      setRecordingTime(0);
      setAudioUrl(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        if (audioElement.current) {
          audioElement.current.src = url;
          audioElement.current.load();
        }
      };

      mediaRecorder.current.start();
      setIsRecording(true);

      recordingTimer.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
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
    
    if (audioElement.current) {
      audioElement.current.pause();
      audioElement.current.src = '';
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
          })
          .catch(error => {
            console.error('Error playing audio:', error);
          });
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