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
        
        try {
          // Get appropriate MIME type
          const mimeType = mediaRecorder.mimeType || 'audio/webm';
          console.log(`Creating blob with type: ${mimeType}`);
          
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          console.log(`Blob created: ${audioBlob.size} bytes`);
          
          if (audioBlob.size === 0) {
            console.error("Audio blob is empty");
            return;
          }
          
          // Using a timestamp to ensure the URL is unique each time
          const timestamp = new Date().getTime();
          const url = URL.createObjectURL(audioBlob) + `#t=${timestamp}`;
          console.log(`URL created: ${url}`);
          
          // Create a temporary audio element to test the blob
          const testAudio = new Audio();
          testAudio.src = url;
          
          // Try to load the audio data to verify it's valid
          testAudio.addEventListener('loadedmetadata', () => {
            console.log(`Test audio loaded, duration: ${testAudio.duration}`);
            
            // If we get here, the audio is valid, so update the UI state
            setAudioUrl(url);
            
            if (audioRef.current) {
              console.log("Setting audio source to main audio element");
              audioRef.current.src = url;
              // Preload the audio
              audioRef.current.load();
            }
          });
          
          testAudio.addEventListener('error', (e) => {
            console.error("Test audio loading failed:", e);
          });
          
          // Load the test audio
          testAudio.load();
          
          // Stop all tracks in the stream
          stream.getTracks().forEach(track => {
            console.log(`Stopping track: ${track.kind}`);
            track.stop();
          });
        } catch (error) {
          console.error("Error creating audio blob:", error);
        }
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
        setIsPlaying(false);
      } else {
        // Always reset the audio source to ensure we're using the latest blob URL
        // with the timestamp to prevent browser caching issues
        console.log(`Setting audio source to ${audioUrl}`);
        audioRef.current.src = audioUrl;
        
        // Force the browser to load the audio
        audioRef.current.load();
        
        // Provide detailed information
        console.log(`Audio ready state: ${audioRef.current.readyState}`);
        
        // Handle loading events properly
        const handleCanPlay = () => {
          console.log(`Audio loaded, duration: ${audioRef.current?.duration}`);
          // Play the audio after we can play
          console.log("Starting audio playback");
          
          // Use a small delay to ensure the browser is ready
          setTimeout(() => {
            const playPromise = audioRef.current?.play();
            if (playPromise) {
              playPromise
                .then(() => {
                  console.log("Audio playback started successfully");
                  setIsPlaying(true);
                })
                .catch(error => {
                  console.error("Error playing audio:", error);
                  // Show specific error code if available
                  if (error.name) {
                    console.error(`Error name: ${error.name}`);
                  }
                  
                  // Create a completely new audio element as a fallback
                  console.log("Creating new audio element as fallback");
                  const newAudio = new Audio(audioUrl);
                  newAudio.addEventListener('play', () => setIsPlaying(true));
                  newAudio.addEventListener('pause', () => setIsPlaying(false));
                  newAudio.addEventListener('ended', () => setIsPlaying(false));
                  newAudio.addEventListener('timeupdate', () => setPlaybackProgress(newAudio.currentTime));
                  
                  newAudio.play().catch(e => {
                    console.error("Final fallback attempt failed:", e);
                  });
                  
                  // Replace the ref with our new element
                  audioRef.current = newAudio;
                });
            }
          }, 100);
          
          // Remove the event listener
          audioRef.current?.removeEventListener('canplay', handleCanPlay);
        };
        
        // Add event listener for canplay
        audioRef.current.addEventListener('canplay', handleCanPlay);
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
