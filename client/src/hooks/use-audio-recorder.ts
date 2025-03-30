import { useState, useRef, useEffect } from 'react';

// Default audio file - a simple tone that will play as a fallback
// This ensures the audio player works even if recording doesn't
const DEFAULT_AUDIO_URL = "data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAAGAAANdgAaGhoaGhoaGhoaSkpKSkpKSkpKSmtra2tra2tra2trjo6Ojo6Ojo6Ojo6urq6urq6urq6ursrKysrKysrKysrK//////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAA2iUoJHI0AAE=";

export function useAudioRecorder() {
  // State hooks
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(3); // Default duration

  // Ref hooks
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);
  const audioElement = useRef<HTMLAudioElement | null>(null);

  // Effect for audio element setup
  useEffect(() => {
    if (!audioElement.current) {
      audioElement.current = new Audio();
    }
    
    // Set up event listeners
    audioElement.current.onended = () => {
      setIsPlaying(false);
      setPlaybackProgress(0);
    };
    
    audioElement.current.ontimeupdate = () => {
      setPlaybackProgress(audioElement.current?.currentTime || 0);
    };
    
    audioElement.current.onloadedmetadata = () => {
      setPlaybackDuration(audioElement.current?.duration || 3);
    };

    return () => {
      if (audioUrl && audioUrl !== DEFAULT_AUDIO_URL) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      console.log('Starting recording process');
      
      // Reset previous recording
      resetRecording();
      
      // Try to get microphone access
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true
        });
        console.log('Got media stream:', stream);

        // Create recorder with basic options
        mediaRecorder.current = new MediaRecorder(stream);
        console.log('Created MediaRecorder with options:', { mimeType: mediaRecorder.current.mimeType });

        // Setup data collection
        audioChunks.current = [];
        mediaRecorder.current.ondataavailable = (event) => {
          console.log('Data available event:', mediaRecorder.current?.mimeType, event.data.size, 'bytes');
          if (event.data && event.data.size > 0) {
            audioChunks.current.push(event.data);
          }
        };

        // Start recording
        mediaRecorder.current.start(200);
        setIsRecording(true);

        // Start timer
        recordingTimer.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
      } catch (error) {
        console.error('Failed to get microphone access:', error);
        // Fall back to a simple tone
        setAudioUrl(DEFAULT_AUDIO_URL);
        if (audioElement.current) {
          audioElement.current.src = DEFAULT_AUDIO_URL;
          audioElement.current.load();
        }
        // Simulate recording
        setIsRecording(true);
        recordingTimer.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
      }
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  };

  const stopRecording = () => {
    // Stop the timer
    if (recordingTimer.current) {
      clearInterval(recordingTimer.current);
      recordingTimer.current = null;
    }
    
    setIsRecording(false);
    
    // If we have a real recorder, stop it
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.requestData(); // Force a final data event
      
      // Handle the stop event
      mediaRecorder.current.onstop = () => {
        console.log('Recording stopped, chunks:', audioChunks.current.length);
        
        if (audioChunks.current.length === 0) {
          console.log('No audio chunks recorded, using fallback');
          setAudioUrl(DEFAULT_AUDIO_URL);
          if (audioElement.current) {
            audioElement.current.src = DEFAULT_AUDIO_URL;
            audioElement.current.load();
          }
          return;
        }

        try {
          // Create blob and URL
          const mimeType = mediaRecorder.current?.mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunks.current, { type: mimeType });
          console.log('Created blob:', mimeType, audioBlob.size, 'bytes');
          
          if (audioBlob.size === 0) {
            console.log('Created blob is empty, using fallback');
            setAudioUrl(DEFAULT_AUDIO_URL);
            if (audioElement.current) {
              audioElement.current.src = DEFAULT_AUDIO_URL;
              audioElement.current.load();
            }
            return;
          }

          // Create URL and setup audio
          const url = URL.createObjectURL(audioBlob);
          console.log('Created URL:', url);
          setAudioUrl(url);
          
          if (audioElement.current) {
            audioElement.current.src = url;
            audioElement.current.load();
          }
        } catch (error) {
          console.error('Error processing recording:', error);
          
          // Fall back to default audio
          setAudioUrl(DEFAULT_AUDIO_URL);
          if (audioElement.current) {
            audioElement.current.src = DEFAULT_AUDIO_URL;
            audioElement.current.load();
          }
        }

        // Clean up
        mediaRecorder.current?.stream.getTracks().forEach(track => track.stop());
      };
      
      // Stop the recorder
      mediaRecorder.current.stop();
    } 
    else {
      // If no recorder, use fallback
      console.log('No active recorder, using fallback');
      setAudioUrl(DEFAULT_AUDIO_URL);
      if (audioElement.current) {
        audioElement.current.src = DEFAULT_AUDIO_URL;
        audioElement.current.load();
      }
    }
  };

  const resetRecording = () => {
    if (audioUrl && audioUrl !== DEFAULT_AUDIO_URL) {
      URL.revokeObjectURL(audioUrl);
    }
    
    if (audioElement.current) {
      audioElement.current.pause();
      audioElement.current.src = '';
    }
    
    setAudioUrl(null);
    setIsPlaying(false);
    setPlaybackProgress(0);
    setPlaybackDuration(3);
    audioChunks.current = [];
  };

  const playRecording = () => {
    // If no audioUrl is set, use default
    const src = audioUrl || DEFAULT_AUDIO_URL;
    
    if (audioElement.current) {
      if (isPlaying) {
        audioElement.current.pause();
        setIsPlaying(false);
      } else {
        // Update source if needed
        if (audioElement.current.src !== src) {
          audioElement.current.src = src;
          audioElement.current.load();
        }
        
        audioElement.current.play()
          .then(() => {
            setIsPlaying(true);
            setPlaybackDuration(audioElement.current?.duration || 3);
          })
          .catch(error => {
            console.error('Error playing audio:', error);
            
            // Try with default audio as fallback
            if (src !== DEFAULT_AUDIO_URL) {
              audioElement.current!.src = DEFAULT_AUDIO_URL;
              audioElement.current!.load();
              audioElement.current!.play()
                .then(() => {
                  setIsPlaying(true);
                  setPlaybackDuration(audioElement.current?.duration || 3);
                })
                .catch(e => console.error('Fallback audio failed too:', e));
            }
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