import { useState, useRef } from 'react';

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
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Try to force a compatible audio format
      let options = {};
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=pcm')) {
        options = { mimeType: 'audio/webm;codecs=pcm' };
      } else if (MediaRecorder.isTypeSupported('audio/wav')) {
        options = { mimeType: 'audio/wav' };
      }
      
      mediaRecorder.current = new MediaRecorder(stream, options);
      console.log('Recording with format:', mediaRecorder.current.mimeType);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        console.log('Recording complete, blob size:', audioBlob.size);
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