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
      console.log("Starting audio recording...");
      
      // Reset previous recording
      if (audioUrl) {
        console.log("Clearing previous recording");
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      
      audioChunksRef.current = [];
      setRecordingTime(0);
      
      console.log("Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      console.log("Microphone access granted");
      
      // Create media recorder with specific MIME type
      let options = {};
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options = { mimeType: 'audio/webm;codecs=opus' };
        console.log("Using audio/webm;codecs=opus");
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/webm' };
        console.log("Using audio/webm");
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options = { mimeType: 'audio/mp4' };
        console.log("Using audio/mp4");
      } else {
        console.log("Using default codec");
      }
      
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      
      console.log("MediaRecorder created");
      
      mediaRecorder.ondataavailable = (event) => {
        console.log(`Data available: ${event.data.size} bytes`);
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        console.log(`Recording stopped. Got ${audioChunksRef.current.length} chunks`);
        
        if (audioChunksRef.current.length === 0) {
          console.error("No audio data recorded");
          return;
        }
        
        // Get appropriate MIME type
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        console.log(`Creating blob with type: ${mimeType}`);
        
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        console.log(`Blob created: ${audioBlob.size} bytes`);
        
        const url = URL.createObjectURL(audioBlob);
        console.log(`URL created: ${url}`);
        setAudioUrl(url);
        
        if (audioRef.current) {
          console.log("Setting audio source");
          audioRef.current.src = url;
          // Preload the audio
          audioRef.current.load();
        }
        
        // Stop all tracks in the stream
        stream.getTracks().forEach(track => {
          console.log(`Stopping track: ${track.kind}`);
          track.stop();
        });
      };
      
      // Add error handling for MediaRecorder
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
      };
      
      // Start recording with 100ms time slices
      mediaRecorder.start(100);
      console.log("Recording started");
      setIsRecording(true);
      
      // Start timer
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      // Show more detailed error for debugging
      if (error instanceof DOMException) {
        console.error(`DOMException: ${error.name} - ${error.message}`);
      }
    }
  };
  
  // Stop recording
  const stopRecording = () => {
    console.log("Attempting to stop recording...");
    
    if (mediaRecorderRef.current && isRecording) {
      try {
        // Make sure we have some data by requesting it one more time
        if (mediaRecorderRef.current.state === "recording") {
          console.log("Requesting final data chunk");
          mediaRecorderRef.current.requestData();
          
          // Small delay to ensure the data is processed
          setTimeout(() => {
            console.log("Stopping MediaRecorder");
            mediaRecorderRef.current?.stop();
          }, 200);
        } else {
          console.log(`MediaRecorder in unexpected state: ${mediaRecorderRef.current.state}`);
        }
        
        setIsRecording(false);
        
        if (timerRef.current) {
          console.log("Clearing recording timer");
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } catch (error) {
        console.error("Error stopping recording:", error);
      }
    } else {
      console.log("Cannot stop recording - MediaRecorder not available or not recording");
      console.log(`mediaRecorderRef.current exists: ${!!mediaRecorderRef.current}`);
      console.log(`isRecording: ${isRecording}`);
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
    console.log("Play/pause recording triggered");
    console.log(`Audio URL exists: ${!!audioUrl}`);
    console.log(`Audio element exists: ${!!audioRef.current}`);
    
    if (!audioUrl) {
      console.error("No audio URL available for playback");
      return;
    }
    
    if (!audioRef.current) {
      console.error("No audio element available for playback");
      return;
    }
    
    try {
      if (isPlaying) {
        console.log("Pausing audio playback");
        audioRef.current.pause();
      } else {
        // Ensure the source is set
        if (audioRef.current.src === '' || !audioRef.current.src.includes('blob')) {
          console.log(`Setting audio source to ${audioUrl}`);
          audioRef.current.src = audioUrl;
          // Force the browser to load the audio
          audioRef.current.load();
        } else {
          console.log(`Using existing audio source: ${audioRef.current.src}`);
        }
        
        // Provide detailed information
        console.log(`Audio duration: ${audioRef.current.duration}`);
        console.log(`Audio ready state: ${audioRef.current.readyState}`);
        console.log(`Audio paused: ${audioRef.current.paused}`);
        
        // Play the audio
        console.log("Starting audio playback");
        const playPromise = audioRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log("Audio playback started successfully");
            })
            .catch(error => {
              console.error("Error playing audio:", error);
              // Try one more time with a reload
              console.log("Attempting to reload and play again");
              audioRef.current?.load();
              setTimeout(() => {
                audioRef.current?.play().catch(e => 
                  console.error("Second attempt to play failed:", e)
                );
              }, 300);
            });
        }
      }
    } catch (error) {
      console.error("Unexpected error in playRecording:", error);
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
