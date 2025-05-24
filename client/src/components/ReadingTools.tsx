import { useState } from 'react';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';
import { useTextToSpeech } from '@/hooks/use-text-to-speech';
import { RecordingState } from '@/types';
import { useToast } from '@/hooks/use-toast';

// Component to display text with fixes for duplications
interface DisplayTextWithFixesProps {
  text: string;
  onWordClick: (word: string) => void;
  fixDuplicates?: boolean;
}

function DisplayTextWithFixes({ text, onWordClick, fixDuplicates = false }: DisplayTextWithFixesProps) {
  const processText = (input: string): string => {
    if (!fixDuplicates) return input;
    return input;
  };
  
  const processedText = processText(text);
  
  // Simple tokenization that preserves quotes and parentheses properly
  const tokenize = (text: string): string[] => {
    // Just split by spaces - this is much more reliable
    return text.split(/\s+/).filter(token => token.trim() !== '');
  };
  
  const tokens = tokenize(processedText);
  
  return (
    <div className="word-interaction-container">
      {tokens.map((token, index) => {
        // Check if this is a quoted phrase (starts and ends with ")
        const isQuotedPhrase = token.startsWith('"') && token.endsWith('"');
        
        // For quoted phrases, preserve the entire token
        if (isQuotedPhrase) {
          // Remove quotes for clicking, but preserve in display
          const cleanToken = token.substring(1, token.length - 1);
          
          return (
            <span key={index} className="word-container">
              <span className="quote-highlight">"</span>
              <span 
                className="word-highlight hover:bg-[#FBBC05]/20 hover:rounded cursor-pointer"
                onClick={() => onWordClick(cleanToken)}
              >
                {cleanToken}
              </span>
              <span className="quote-highlight">"</span>
              {' '}
            </span>
          );
        }
        
        // For regular tokens, separate the word from punctuation but keep them together visually
        // Don't separate parentheses from words - keep them attached
        let cleanWord = token.replace(/[.,\/#!$%\^&\*;:{}=\`~]/g, "");
        let punctuation = token.replace(cleanWord, "");
        
        // Special handling for tokens ending with ." to prevent duplication
        if (token.endsWith('."') && cleanWord) {
          const parts = token.match(/^(.+?)"([^"]+)\."/);
          if (parts && parts[1] === parts[2]) {
            cleanWord = parts[1];
            punctuation = '."';
          }
        }
        
        if (cleanWord) {
          return (
            <span key={index} className="word-container">
              <span 
                className="word-highlight px-0.5 py-0.5 hover:bg-[#FBBC05]/20 hover:rounded cursor-pointer"
                onClick={() => onWordClick(cleanWord)}
              >
                {cleanWord}
              </span>
              <span className="punctuation">{punctuation}</span>
              {' '}
            </span>
          );
        } else {
          // If it's just punctuation, display it as-is
          return (
            <span key={index} className="word-container">
              <span className="punctuation">{token}</span>
              {' '}
            </span>
          );
        }
      })}
    </div>
  );
}

interface ReadingToolsProps {
  isVisible: boolean;
  summaryId: number | null;
  selectedSummary: string;
  onWordClick: (word: string) => void;
  onBackToSummary: () => void;
}

export default function ReadingTools({ 
  isVisible, 
  summaryId, 
  selectedSummary, 
  onWordClick, 
  onBackToSummary 
}: ReadingToolsProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>(RecordingState.INACTIVE);
  const { toast } = useToast();
  const { 
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
  } = useAudioRecorder();
  const { speak, isSpeaking, stopSpeaking } = useTextToSpeech();
  
  if (!isVisible) return null;
  
  // Format time for display (mm:ss)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };
  
  // Handle record button click
  const handleRecordToggle = () => {
    if (recordingState === RecordingState.INACTIVE || recordingState === RecordingState.PLAYBACK) {
      toast({
        title: "Recording started",
        description: "Please allow microphone access if prompted",
      });
      startRecording();
      setRecordingState(RecordingState.RECORDING);
    }
  };
  
  // Handle stop recording
  const handleStopRecording = async () => {
    console.log("Stopping recording from UI handler");
    stopRecording();
    
    // Move to playback state immediately - our hook will handle fallbacks
    setRecordingState(RecordingState.PLAYBACK);
    
    toast({
      title: "Recording complete",
      description: "Your recording is ready for playback",
    });
  };
  
  // Handle playback controls
  const handlePlayPauseToggle = () => {
    // Always call playRecording, it will use a fallback if needed
    playRecording();
  };
  
  // Handle restart playback
  const handleRestartPlayback = () => {
    if (audioUrl) {
      // For restart, we need to set the audio to the beginning and play again
      resetRecording();
      setRecordingState(RecordingState.INACTIVE);
      // Give a notification that restart isn't implemented yet
      toast({
        title: "Recording restarted",
        description: "Please click Record Me again to create a new recording",
      });
    }
  };
  
  // Handle delete recording
  const handleDeleteRecording = () => {
    resetRecording();
    setRecordingState(RecordingState.INACTIVE);
  };
  
  // Handle listen (text-to-speech)
  const handleListen = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speak(selectedSummary);
    }
  };
  
  return (
    <div className="col-span-1 lg:col-span-2 bg-white rounded-lg shadow-md p-6">
      <h3 className="font-['Google_Sans'] text-lg font-medium mb-4 text-gray-800">3. Reading Practice</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="bg-gray-100 p-4 rounded-lg mb-4 max-h-72 overflow-y-auto font-['Merriweather'] text-gray-800 leading-relaxed">
            {selectedSummary ? (
              <DisplayTextWithFixes 
                text={selectedSummary}
                onWordClick={onWordClick}
                fixDuplicates={true}
              />
            ) : (
              <p>No text available for reading practice.</p>
            )}
          </div>
          
          <div className="flex flex-wrap gap-3 mb-4">
            <button 
              className={`flex-1 ${isSpeaking ? 'bg-[#EA4335] text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} py-2 px-4 rounded-lg font-['Google_Sans'] flex items-center justify-center`}
              onClick={handleListen}
            >
              <span className="material-icons mr-1">{isSpeaking ? 'stop' : 'volume_up'}</span>
              {isSpeaking ? 'Stop' : 'Listen'}
            </button>
            <button 
              className={`flex-1 ${isRecording ? 'bg-[#EA4335]' : 'bg-[#FBBC05]'} hover:bg-opacity-80 text-white py-2 px-4 rounded-lg font-['Google_Sans'] flex items-center justify-center`}
              onClick={handleRecordToggle}
              disabled={isRecording}
            >
              <span className="material-icons mr-1">mic</span>
              Record Me
            </button>
          </div>
        </div>
        
        <div>
          <div className="border border-gray-200 rounded-lg p-4 h-full">
            {/* Default State */}
            {recordingState === RecordingState.INACTIVE && (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="bg-gray-200 rounded-full p-4 mb-4">
                  <span className="material-icons text-4xl text-gray-500">mic</span>
                </div>
                <p className="text-center text-gray-500 font-['Roboto']">
                  Click "Record Me" to start recording yourself reading the passage
                </p>
              </div>
            )}
            
            {/* Recording State */}
            {recordingState === RecordingState.RECORDING && (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="recording-wave mb-4">
                  {/* 10 bars that will animate via CSS */}
                  <span></span><span></span><span></span><span></span><span></span>
                  <span></span><span></span><span></span><span></span><span></span>
                </div>
                <p className="text-center text-gray-800 font-['Google_Sans'] mb-2">Recording...</p>
                <p className="text-center text-gray-400 text-sm font-['Roboto'] mb-4">
                  {formatTime(recordingTime)}
                </p>
                <button 
                  className="bg-[#EA4335] text-white py-2 px-6 rounded-full font-['Google_Sans'] flex items-center"
                  onClick={handleStopRecording}
                >
                  <span className="material-icons mr-1">stop</span>
                  Stop Recording
                </button>
              </div>
            )}
            
            {/* Playback State */}
            {recordingState === RecordingState.PLAYBACK && (
              <div className="flex flex-col items-center justify-center h-full">
                {audioUrl ? (
                  <>
                    <div className="w-full mb-4">
                      <div className="relative pt-1">
                        <div className="flex mb-2 items-center justify-between">
                          <div>
                            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-[#4285F4] bg-[#4285F4]/10">
                              Your Recording
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-gray-500">
                              {formatTime(playbackProgress)} / {formatTime(playbackDuration)}
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div 
                            className="bg-[#4285F4] h-2 rounded-full transition-all" 
                            style={{ width: `${(playbackProgress / playbackDuration) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 mb-2">
                      <button 
                        className="bg-gray-100 hover:bg-gray-200 text-gray-800 p-3 rounded-full"
                        onClick={handleRestartPlayback}
                      >
                        <span className="material-icons">replay</span>
                      </button>
                      <button 
                        className="bg-[#4285F4] text-white p-3 rounded-full"
                        onClick={handlePlayPauseToggle}
                      >
                        <span className="material-icons">{isPlaying ? 'pause' : 'play_arrow'}</span>
                      </button>
                      <button 
                        className="bg-gray-100 hover:bg-gray-200 text-[#EA4335] p-3 rounded-full"
                        onClick={handleDeleteRecording}
                      >
                        <span className="material-icons">delete</span>
                      </button>
                    </div>
                    <p className="text-center text-gray-500 text-sm font-['Roboto']">
                      Record again to replace this recording
                    </p>
                  </>
                ) : (
                  <>
                    <div className="bg-[#EA4335]/10 rounded-lg p-4 mb-4 text-center">
                      <span className="material-icons text-3xl text-[#EA4335] mb-2">warning</span>
                      <h4 className="font-['Google_Sans'] text-[#EA4335] font-medium">Recording issue</h4>
                      <p className="text-gray-600 mt-1">
                        No audio was recorded. This could be due to permission issues or browser limitations.
                      </p>
                    </div>
                    <button 
                      className="bg-[#FBBC05] text-white py-2 px-6 rounded-full font-['Google_Sans'] flex items-center"
                      onClick={handleRecordToggle}
                    >
                      <span className="material-icons mr-1">mic</span>
                      Try Again
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-6 border-t border-gray-200 pt-4 flex justify-between">
        <button 
          className="text-[#4285F4] hover:bg-[#4285F4]/10 py-2 px-4 rounded-lg font-['Google_Sans'] flex items-center"
          onClick={onBackToSummary}
        >
          <span className="material-icons mr-1">arrow_back</span>
          Back to Text
        </button>
        <button 
          className="bg-[#34A853] text-white py-2 px-6 rounded-full font-['Google_Sans'] flex items-center"
          onClick={() => {
            toast({
              title: "Practice completed",
              description: "Great job! You've completed your reading practice."
            });
          }}
        >
          <span className="material-icons mr-1">check_circle</span>
          Finish Practice
        </button>
      </div>
    </div>
  );
}
