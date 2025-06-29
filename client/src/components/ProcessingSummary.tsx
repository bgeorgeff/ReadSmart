import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useTextToSpeech } from '@/hooks/use-text-to-speech';
import { GradeLevel, Summaries, ProcessTextResponse } from '@/types';

// Component to display text with fixes for duplications
interface DisplayTextWithFixesProps {
  text: string;
  onWordClick: (word: string) => void;
}

function DisplayTextWithFixes({ text, onWordClick }: DisplayTextWithFixesProps) {
  const processedText = text;

  // Simple tokenization that preserves quotes and parentheses properly
  const tokenize = (text: string): string[] => {
    // Split by spaces and filter empty tokens
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
        let cleanWord = token.replace(/[.,\/#!$%\^&\*;:{}=\`~]/g, "");
        let punctuation = token.replace(cleanWord, "");

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

interface ProcessingSummaryProps {
  isVisible: boolean;
  summaryId: number | null;
  summaries: Summaries | null;
  currentGradeLevel: GradeLevel;
  inputText: string;
  onGradeLevelChange: (level: GradeLevel) => void;
  onWordClick: (word: string) => void;
  onContinueToReading: () => void;
  onNavigateBack: () => void;
  onProcessingComplete: (summaryId: number, summaries: Summaries) => void;
  showBackButton?: boolean;
}

export default function ProcessingSummary({ 
  isVisible, 
  summaryId, 
  summaries, 
  currentGradeLevel, 
  inputText,
  onGradeLevelChange, 
  onWordClick, 
  onContinueToReading,
  onNavigateBack,
  onProcessingComplete,
  showBackButton = true
}: ProcessingSummaryProps) {
  const [progressWidth, setProgressWidth] = useState(0);
  const { toast } = useToast();
  const { speak } = useTextToSpeech();

  // Determine if we should show processing state
  const isProcessing = isVisible && !summaries && !summaryId;

  // Get the selected summary based on current grade level
  const selectedSummary = summaries ? (currentGradeLevel === 0 ? inputText : summaries[currentGradeLevel]) : null;

  // Process text mutation
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/process-text', { text: inputText });
      return await response.json() as ProcessTextResponse;
    },
    onSuccess: (data) => {
      if (data.success) {
        onProcessingComplete(data.summaryId, data.summaries);
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to process text',
          variant: 'destructive'
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: (error as Error).message || 'Failed to process text',
        variant: 'destructive'
      });
    }
  });

  // Trigger the API call when isProcessing becomes true
  useEffect(() => {
    if (isProcessing && !summaryId) {
      mutate();
    }
  }, [isProcessing, mutate, summaryId]);

  // Animation for the progress bar with slower, more accurate pacing
  useEffect(() => {
    if (isPending) {
      // Reset progress when starting
      setProgressWidth(0);

      // Create a slower, more realistic progress simulation
      const simulateProgress = () => {
        // Very slow initial progress (0-20%)
        const initialProgress = setInterval(() => {
          setProgressWidth(prev => {
            if (prev >= 20) {
              clearInterval(initialProgress);
              return 20;
            }
            return prev + 1;
          });
        }, 300);

        // Slow progress (20-45%)
        setTimeout(() => {
          const slowProgress = setInterval(() => {
            setProgressWidth(prev => {
              if (prev >= 45) {
                clearInterval(slowProgress);
                return 45;
              }
              return prev + 0.5;
            });
          }, 400);
        }, 6000);

        // Very slow progress (45-70%)
        setTimeout(() => {
          const verySlowProgress = setInterval(() => {
            setProgressWidth(prev => {
              if (prev >= 70) {
                clearInterval(verySlowProgress);
                return 70;
              }
              return prev + 0.3;
            });
          }, 500);
        }, 16000);

        // Extremely slow final progress (70-75%)
        setTimeout(() => {
          const finalProgress = setInterval(() => {
            setProgressWidth(prev => {
              if (prev >= 75) {
                clearInterval(finalProgress);
                return 75;
              }
              return prev + 0.1;
            });
          }, 800);
        }, 33000);
      };

      simulateProgress();

      return () => {
        // Clear any lingering intervals on cleanup
        const highId = window.setTimeout(() => {}, 0);
        for (let i = highId; i >= 0; i--) {
          if (i !== highId) window.clearInterval(i);
        }
      };
    } else if (!isPending && isProcessing) {
      // Complete the progress bar when done
      setProgressWidth(100);
    }
  }, [isPending, isProcessing]);

  // Function to handle grade level change
  const handleGradeLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const gradeLevel = parseInt(e.target.value) as GradeLevel;
    onGradeLevelChange(gradeLevel);
  };

  // Function to copy result to clipboard
  const handleCopyResult = () => {
    if (selectedSummary) {
      navigator.clipboard.writeText(selectedSummary).then(
        () => {
          toast({
            title: 'Copied',
            description: 'Text copied to clipboard'
          });
        },
        () => {
          toast({
            title: 'Error',
            description: 'Failed to copy text to clipboard',
            variant: 'destructive'
          });
        }
      );
    }
  };

  if (!isVisible) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="font-['Google_Sans'] text-lg font-medium mb-4 text-gray-800">2. AI Summaries</h3>

      {/* Processing State */}
      {isProcessing && (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4285F4] mb-4"></div>
          
          {/* Progress Bar */}
          <div className="w-64 bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-[#4285F4] h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressWidth}%` }}
            ></div>
          </div>
          
          <p className="text-gray-500 text-sm font-['Google_Sans']">Summarizing your text for all reading levels...</p>
        </div>
      )}

      {/* Result State */}
      {!isPending && summaries && (
        <div>
          <div className="mb-4">
            <label htmlFor="grade-level" className="block text-sm font-medium text-gray-500 mb-1">Select grade level:</label>
            <div className="relative">
              <select 
                id="grade-level" 
                className="appearance-none block w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4285F4] font-['Roboto']"
                onChange={handleGradeLevelChange}
                value={currentGradeLevel}
              >
                <option value="0">Original Paste</option>
                <option value="1">1st Grade (Age 6-7)</option>
                <option value="2">2nd Grade (Age 7-8)</option>
                <option value="3">3rd Grade (Age 8-9)</option>
                <option value="4">4th Grade (Age 9-10)</option>
                <option value="5">5th Grade (Age 10-11)</option>
                <option value="6">6th Grade (Age 11-12)</option>
                <option value="7">7th Grade (Age 12-13)</option>
                <option value="8">8th Grade (Age 13-14)</option>
                <option value="9">9th Grade (Age 14-15)</option>
                <option value="10">10th Grade (Age 15-16)</option>
                <option value="11">11th Grade (Age 16-17)</option>
                <option value="12">12th Grade (Age 17-18)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <span className="material-icons">expand_more</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <button
                onClick={() => speak("Click any word for definition and pronunciation")}
                className="text-[#4285F4] hover:bg-[#4285F4]/10 p-1 rounded mr-2"
                aria-label="Listen to instructions"
              >
                <span className="material-icons">volume_up</span>
              </button>
              <p className="text-sm text-gray-500 font-['Roboto']">Click any word for definition & pronunciation</p>
            </div>
            <button 
              className="text-[#4285F4] hover:bg-[#4285F4]/10 p-1 rounded flex items-center text-sm"
              onClick={handleCopyResult}
            >
              <span className="material-icons text-sm mr-1">content_copy</span>
              Copy
            </button>
          </div>

          <div className="p-4 bg-gray-100 rounded-lg max-h-64 overflow-y-auto font-['Merriweather'] text-gray-800 leading-relaxed">
            {selectedSummary && currentGradeLevel === 0 && inputText ? (
              // For Original Paste, show user's original text with simple word splitting
              <div className="text-base leading-relaxed text-gray-800">
                {inputText.split(/\s+/).map((word, index) => (
                  <span key={index} className="word-container">
                    <button
                      onClick={() => onWordClick(word.replace(/[^\w]/g, ''))}
                      className="hover:bg-blue-100 hover:text-blue-600 px-1 py-0.5 rounded transition-colors duration-200 cursor-pointer"
                    >
                      {word}
                    </button>
                    {index < inputText.split(/\s+/).length - 1 && ' '}
                  </span>
                ))}
              </div>
            ) : selectedSummary ? (
              // Otherwise, display the selected summary
              <DisplayTextWithFixes 
                text={selectedSummary}
                onWordClick={onWordClick}
              />
            ) : (
              // Fallback if no summary is available
              <p>No summary available for this grade level.</p>
            )}
          </div>

          <div className="mt-4 flex justify-end">
            <button 
              className="bg-[#4285F4] text-white py-2 px-6 rounded-full font-['Google_Sans'] flex items-center"
              onClick={onContinueToReading}
            >
              Continue to Reading
              <span className="material-icons ml-1">arrow_forward</span>
            </button>
          </div>
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
  );
}