import { useState, useRef, useEffect } from 'react';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';
import { useTextToSpeech } from '@/hooks/use-text-to-speech';
import { RecordingState } from '@/types';
import { useToast } from '@/hooks/use-toast';

// Component to display text with clickable words for definitions and highlighting
interface DisplayTextWithFixesProps {
  text: string;
  onWordClick: (word: string) => void;
  highlightedWordIndex?: number;
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
}

function DisplayTextWithFixes({ text, onWordClick, highlightedWordIndex = -1, scrollContainerRef }: DisplayTextWithFixesProps) {
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);

  // Auto-scroll to highlighted word with responsive positioning and predictive scrolling
  useEffect(() => {
    if (highlightedWordIndex >= 0 && wordRefs.current[highlightedWordIndex] && scrollContainerRef?.current) {
      const highlightedElement = wordRefs.current[highlightedWordIndex];
      const container = scrollContainerRef.current;
      
      if (highlightedElement) {
        const elementTop = highlightedElement.offsetTop;
        const elementHeight = highlightedElement.offsetHeight;
        const containerTop = container.scrollTop;
        const containerHeight = container.clientHeight;
        
        // Get padding to account for container padding
        const containerPadding = 16; // 4 * 4px from p-4 class
        
        // Calculate scroll buffer based on screen size for responsiveness
        const isMobile = window.innerWidth < 768;
        const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
        
        // Adjust buffer zones based on device type
        let scrollBuffer: number;
        let targetPosition: number;
        
        if (isMobile) {
          scrollBuffer = containerHeight * 0.15; // Smaller buffer on mobile
          targetPosition = 0.15; // Keep words closer to top on mobile
        } else if (isTablet) {
          scrollBuffer = containerHeight * 0.2;
          targetPosition = 0.2;
        } else {
          scrollBuffer = containerHeight * 0.25; // Larger buffer on desktop
          targetPosition = 0.25;
        }
        
        // Calculate if element needs scrolling (with buffer zones)
        const elementBottom = elementTop + elementHeight;
        const viewTop = containerTop + scrollBuffer;
        const viewBottom = containerTop + containerHeight - scrollBuffer;
        
        const needsScrollUp = elementTop < viewTop;
        const needsScrollDown = elementBottom > viewBottom;
        
        if (needsScrollUp || needsScrollDown) {
          const targetScroll = elementTop - (containerHeight * targetPosition) + containerPadding;
          
          // Use requestAnimationFrame for smoother timing with speech synthesis
          requestAnimationFrame(() => {
            container.scrollTo({
              top: Math.max(0, targetScroll),
              behavior: 'smooth'
            });
          });
        }
      }
    }
  }, [highlightedWordIndex, scrollContainerRef]);
  const processedText = text;

  // Create a simple token array that matches the text-to-speech tokenization
  const allTokens = processedText.split(/\s+/).filter(token => token.trim() !== '');
  
  // Split text into paragraphs for display formatting
  const paragraphs = processedText.split('\n');
  
  // Keep a running total of tokens across all paragraphs for highlighting
  let totalTokenIndex = 0;

  return (
    <div className="word-interaction-container">
      {paragraphs.map((paragraph, paragraphIndex) => {
        if (paragraph.trim() === '') {
          // Empty paragraph creates a line break
          return <div key={`para-${paragraphIndex}`} className="h-4"></div>;
        }

        // Get the tokens for this paragraph using the same simple method as text-to-speech
        const paragraphTokens = paragraph.split(/\s+/).filter(token => token.trim() !== '');

        return (
          <div key={`para-${paragraphIndex}`} className="mb-4">
            {paragraphTokens.map((token, tokenIndex) => {
              // Check if this token should be highlighted during speech
              const isHighlighted = highlightedWordIndex === totalTokenIndex;
              totalTokenIndex++; // Increment for next word

              // Check if this is a quoted phrase (starts and ends with ")
              const isQuotedPhrase = token.startsWith('"') && token.endsWith('"') && token.length > 2;

              if (isQuotedPhrase) {
                // Remove quotes for clicking, but preserve in display
                const cleanToken = token.substring(1, token.length - 1);

                return (
                  <span key={`${paragraphIndex}-${tokenIndex}`}>
                    <span className="quote-highlight">"</span>
                    <span 
                      ref={(el) => wordRefs.current[totalTokenIndex - 1] = el}
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
              } else {
                // Regular token - separate word from punctuation
                const match = token.match(/^([a-zA-Z]+)([^a-zA-Z]*)$/);
                if (match) {
                  const word = match[1];
                  const punctuation = match[2];

                  return (
                    <span key={`${paragraphIndex}-${tokenIndex}`}>
                      <span
                        ref={(el) => wordRefs.current[totalTokenIndex - 1] = el}
                        className={`word-highlight hover:bg-[#FBBC05]/20 hover:rounded cursor-pointer transition-colors duration-200 px-1 ${
                          isHighlighted ? 'bg-[#4285F4]/30 rounded' : ''
                        }`}
                        onClick={() => onWordClick(word)}
                      >
                        {word}
                      </span>
                      {punctuation && <span>{punctuation}</span>}
                      {' '}
                    </span>
                  );
                } else {
                  // Fallback for tokens that don't match expected pattern
                  return (
                    <span key={`${paragraphIndex}-${tokenIndex}`}>
                      <span
                        ref={(el) => wordRefs.current[totalTokenIndex - 1] = el}
                        className={`word-highlight hover:bg-[#FBBC05]/20 hover:rounded cursor-pointer transition-colors duration-200 px-1 ${
                          isHighlighted ? 'bg-[#4285F4]/30 rounded' : ''
                        }`}
                        onClick={() => onWordClick(token)}
                      >
                        {token}
                      </span>
                      {' '}
                    </span>
                  );
                }
              }
            })}
          </div>
        );
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
  onNavigateBack: () => void;
  showBackButton?: boolean;
}

export default function ReadingTools({ 
  isVisible, 
  summaryId, 
  selectedSummary, 
  onWordClick, 
  onBackToSummary,
  onNavigateBack,
  showBackButton = true
}: ReadingToolsProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>(RecordingState.INACTIVE);
  const [highlightedWordIndex, setHighlightedWordIndex] = useState<number>(-1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [speechRate, setSpeechRate] = useState<number>(0.65); // Default to 135 WPM

  // WPM to speech rate mapping - final calibrated range (105-165 WPM)
  const wpmToSpeechRate = {
    105: 0.5,  // CALIBRATED: Gives ~108 WPM actual ✓
    120: 0.58, // CALIBRATED: Gives 121.6 WPM actual ✓
    135: 0.65, // CALIBRATED: Gives ~134 WPM actual ✓
    150: 1.0,  // CALIBRATED: Gives 148 WPM actual ✓
    165: 1.3   // CALIBRATED: Gives 167 WPM actual ✓
  };

  // Convert speech rate to WPM using the mapping
  const speechRateToWPM = (rate: number): number => {
    // Find the closest WPM value in our mapping
    const wpmValues = Object.keys(wpmToSpeechRate).map(Number);
    const rates = Object.values(wpmToSpeechRate);

    // Find the closest rate in our mapping
    let closestIndex = 0;
    let closestDiff = Math.abs(rates[0] - rate);

    for (let i = 1; i < rates.length; i++) {
      const diff = Math.abs(rates[i] - rate);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestIndex = i;
      }
    }

    return wpmValues[closestIndex];
  };
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
    playbackDuration,
    permissionError
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
          description: permissionError || "Please check microphone permissions and try again",
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
    <div className="col-span-1 lg:col-span-2 bg-white/80 backdrop-blur-sm border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg p-6">
      <h3 className="font-['Google_Sans'] text-lg font-medium mb-4 text-gray-800">3. Reading Practice</h3>

      <div>
          <div 
            ref={scrollContainerRef}
            className="p-4 bg-gray-100 rounded-lg max-h-64 overflow-y-auto font-['Merriweather'] text-gray-800 leading-relaxed"
          >
            {selectedSummary ? (
              <DisplayTextWithFixes 
                text={selectedSummary}
                onWordClick={onWordClick}
                highlightedWordIndex={highlightedWordIndex}
                scrollContainerRef={scrollContainerRef}
              />
            ) : (
              <p>No text available for reading practice.</p>
            )}
          </div>

          {/* Reading Speed Slider */}
          <div className="mb-4 mt-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 font-['Google_Sans']">
                Reading Speed: {speechRateToWPM(speechRate)} WPM
              </label>
            </div>
            <input
              type="range"
              min="0"
              max="4"
              step="1"
              value={Object.values(wpmToSpeechRate).indexOf(speechRate)}
              onChange={(e) => {
                const index = parseInt(e.target.value);
                const rates = Object.values(wpmToSpeechRate);
                setSpeechRate(rates[index]);
              }}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1 font-['Roboto']">
              <span>105</span>
              <span>120</span>
              <span>135</span>
              <span>150</span>
              <span>165</span>
            </div>
          </div>

          {/* Responsive button grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {/* Listen Button */}
            <button 
              className={`${isSpeaking ? 'bg-[#EA4335] text-white' : 'bg-[#F57C00] hover:bg-[#F57C00]/80 text-white'} py-2 px-3 rounded-lg font-['Google_Sans'] flex items-center justify-center text-sm`}
              onClick={handleListen}
            >
              <span className="material-icons text-sm mr-1">{isSpeaking ? 'stop' : 'volume_up'}</span>
              <span className="hidden sm:inline">{isSpeaking ? 'Stop' : 'Listen'}</span>
            </button>

            {/* Record Me Button */}
            <button 
              className={`${isRecording ? 'bg-[#EA4335]' : 'bg-[#FBBC05]'} hover:bg-opacity-80 text-white py-2 px-3 rounded-lg font-['Google_Sans'] flex items-center justify-center text-sm`}
              onClick={isRecording ? handleStopRecording : handleRecordToggle}
            >
              <span className="material-icons text-sm mr-1">{isRecording ? 'stop' : 'mic'}</span>
              <span className="hidden sm:inline">{isRecording ? 'Stop' : 'Record Me'}</span>
            </button>

            {/* Play Back Button */}
            <button 
              className="bg-[#34A853] hover:bg-[#34A853]/90 text-white py-2 px-3 rounded-lg font-['Google_Sans'] flex items-center justify-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handlePlayPauseToggle}
              disabled={recordingState === RecordingState.INACTIVE || recordingState === RecordingState.RECORDING}
            >
              <span className="material-icons text-sm mr-1">{isPlaying ? 'pause' : 'play_arrow'}</span>
              <span className="hidden sm:inline">{isPlaying ? 'Pause' : 'Play'}</span>
            </button>

            {/* Redo Button */}
            <button 
              className="bg-[#4285F4] hover:bg-[#4285F4]/90 text-white py-2 px-3 rounded-lg font-['Google_Sans'] flex items-center justify-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleRestartPlayback}
              disabled={recordingState === RecordingState.INACTIVE || recordingState === RecordingState.RECORDING}
            >
              <span className="material-icons text-sm mr-1">replay</span>
              <span className="hidden sm:inline">Redo</span>
            </button>
          </div>

          {/* Recording State - Wave lines and timer below buttons */}
          {recordingState === RecordingState.RECORDING && (
            <div className="flex flex-col items-center mb-4">
              <div className="recording-wave mb-2">
                {/* 10 bars that will animate via CSS */}
                <span></span><span></span><span></span><span></span><span></span>
                <span></span><span></span><span></span><span></span><span></span>
              </div>
              <p className="text-center text-gray-400 text-sm font-['Roboto']">
                {formatTime(recordingTime)}
              </p>
            </div>
          )}

          {showBackButton && (
            <div className="mt-4 border-t border-gray-200 pt-4 flex justify-center">
              <button 
                className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-6 rounded-lg font-['Google_Sans'] flex items-center"
                onClick={onNavigateBack}
              >
                <span className="material-icons mr-1">arrow_back</span>
                Back
              </button>
            </div>
          )}
        </div>
    </div>
  );
}