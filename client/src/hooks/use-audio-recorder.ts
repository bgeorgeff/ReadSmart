
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
      console.log('Starting recording process');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 44100
        }
      });
      console.log('Got media stream:', stream);
      
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
        
      const options = { 
        mimeType,
        audioBitsPerSecond: 128000
      };
      
      mediaRecorder.current = new MediaRecorder(stream, options);
      console.log('Created MediaRecorder with options:', options);
      
      audioChunks.current = [];
      setRecordingTime(0);
      
      mediaRecorder.current.ondataavailable = (event) => {
        console.log('Data available event:', event.data.type, event.data.size, 'bytes');
        if (event.data && event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      mediaRecorder.current.start(200);
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
        console.log('Recording stopped, chunks:', audioChunks.current.length);
        if (audioChunks.current.length === 0) {
          console.error('No audio chunks recorded');
          return;
        }
        
        try {
          const audioBlob = new Blob(audioChunks.current, { type: mediaRecorder.current?.mimeType || 'audio/webm' });
          console.log('Created blob:', audioBlob.type, audioBlob.size, 'bytes');
          if (audioBlob.size === 0) {
            console.error('Created blob is empty');
            return;
          }
          const url = URL.createObjectURL(audioBlob);
          console.log('Created URL:', url);
          setAudioUrl(url);
        
        if (audioElement.current) {
          audioElement.current.src = url;
          audioElement.current.preload = 'metadata';
          
          audioElement.current.onloadedmetadata = () => {
            setPlaybackDuration(audioElement.current?.duration || 0);
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
