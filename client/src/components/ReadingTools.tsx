import { useState } from 'react';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';
import { useTextToSpeech } from '@/hooks/use-text-to-speech';
import { RecordingState } from '@/types';
import { useToast } from '@/hooks/use-toast';

// Component to display text with clickable words for definitions and highlighting
interface DisplayTextWithFixesProps {
  text: string;
  onWordClick: (word: string) => void;
  highlightedWordIndex?: number;
}

function DisplayTextWithFixes({ text, onWordClick, highlightedWordIndex = -1 }: DisplayTextWithFixesProps) {
  const processedText = text;
  
  // Simple tokenization that preserves quotes and parentheses properly
  const tokenize = (text: string): string[] => {
    return text.split(/\s+/).filter(token => token.trim() !== '');
  };
  
  const tokens = tokenize(processedText);
  
  return (
    <div className="word-interaction-container">
      {tokens.map((token, index) => {
        // Check if this is a quoted phrase (starts and ends with ")
        const isQuotedPhrase = token.startsWith('"') && token.endsWith('"');
        
        // Check if this token should be highlighted during speech
        const isHighlighted = highlightedWordIndex === index;
        
        // For quoted phrases, preserve the entire token
        if (isQuotedPhrase) {
          // Remove quotes for clicking, but preserve in display
          const cleanToken = token.substring(1, token.length - 1);
          
          return (
            <span key={index} className="word-container">
              <span className="quote-highlight">"</span>
              <span 
                className={`word-highlight hover:bg-[#FBBC05]/20 hover:rounded cursor-pointer transition-colors duration-200 px-1 ${
                  isHighlighted ? 'bg-[#4285F4]/30 rounded' : ''
                }`}
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
        let cleanWord = token.replace(/[.,\/#!$%\^&\*;:{}=\`~]/g, "");
        let punctuation = token.replace(cleanWord, "");
        
        if (cleanWord) {
          return (
            <span key={index} className="word-container">
              <span 
                className={`word-highlight px-1 py-0.5 hover:bg-[#FBBC05]/20 hover:rounded cursor-pointer transition-colors duration-200 ${
                  isHighlighted ? 'bg-[#4285F4]/30 rounded' : ''
                }`}
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
  const [highlightedWordIndex, setHighlightedWordIndex] = useState<number>(-1);

  const [speechRate, setSpeechRate] = useState<number>(0.9);
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
  const handleRecordToggle = async () => {
    if (recordingState === RecordingState.INACTIVE || recordingState === RecordingState.PLAYBACK) {
      try {
        await startRecording();
        setRecordingState(RecordingState.RECORDING);
      } catch (error) {
        console.error('Recording start failed:', error);
        toast({
          title: "Recording failed",
          description: "Please check microphone permissions and try again",
          variant: "destructive"
        });
      }
    }
  };
  
  // Handle stop recording
  const handleStopRecording = () => {
    stopRecording();
    // Small delay to let the audioUrl get set before switching to playback state
    setTimeout(() => {
      setRecordingState(RecordingState.PLAYBACK);
    }, 100);
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
  
  // Handle listen (text-to-speech) with word highlighting
  const handleListen = () => {
    if (isSpeaking) {
      stopSpeaking();
      setHighlightedWordIndex(-1); // Clear highlighting when stopped
    } else {
      speak(selectedSummary, (wordIndex: number) => {
        setHighlightedWordIndex(wordIndex);
      }, speechRate);
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
                highlightedWordIndex={highlightedWordIndex}
              />
            ) : (
              <p>No text available for reading practice.</p>
            )}
          </div>
          
          {/* Reading Speed Slider */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose Reading Speed: {speechRate.toFixed(1)}x
            </label>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs text-gray-500">Slow</span>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={speechRate}
                onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #4285F4 0%, #4285F4 ${((speechRate - 0.5) / 1.5) * 100}%, #e5e7eb ${((speechRate - 0.5) / 1.5) * 100}%, #e5e7eb 100%)`
                }}
              />
              <span className="text-xs text-gray-500">Fast</span>
            </div>
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
