import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useTextToSpeech } from '@/hooks/use-text-to-speech';
import { GradeLevel, Summaries, ProcessTextResponse } from '@/types';

// Helper function to get grade suffix (1st, 2nd, 3rd, etc.)
function getGradeSuffix(grade: number): string {
  if (grade === 1) return 'st';
  if (grade === 2) return 'nd';
  if (grade === 3) return 'rd';
  return 'th';
}

// Component to display text with fixes for duplications
interface DisplayTextWithFixesProps {
  text: string;
  onWordClick: (word: string) => void;
}

function DisplayTextWithFixes({ text, onWordClick }: DisplayTextWithFixesProps) {
  const processedText = text;

  // Split text into paragraphs and then tokenize each paragraph
  const paragraphs = processedText.split('\n');

  return (
    <div className="word-interaction-container">
      {paragraphs.map((paragraph, paragraphIndex) => {
        if (paragraph.trim() === '') {
          // Empty paragraph creates a line break
          return <div key={`para-${paragraphIndex}`} className="h-4"></div>;
        }

        // Tokenize each paragraph
        const tokens = paragraph.split(/(\s+)/).filter(token => token !== '');

        return (
          <div key={`para-${paragraphIndex}`} className="mb-4">
            {tokens.map((token, tokenIndex) => {
              // If token is just whitespace, render as space
              if (/^\s+$/.test(token)) {
                return <span key={`${paragraphIndex}-${tokenIndex}`}> </span>;
              }

              // Check if this is a quoted phrase (starts and ends with ")
              const isQuotedPhrase = token.startsWith('"') && token.endsWith('"') && token.length > 2;

              if (isQuotedPhrase) {
                // Remove quotes for clicking, but preserve in display
                const cleanToken = token.substring(1, token.length - 1);

                return (
                  <span key={`${paragraphIndex}-${tokenIndex}`}>
                    <span
                      className="clickable-word cursor-pointer hover:bg-yellow-200 rounded px-1"
                      onClick={() => onWordClick(cleanToken)}
                    >
                      {token}
                    </span>
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
                        className="clickable-word cursor-pointer hover:bg-yellow-200 rounded px-1"
                        onClick={() => onWordClick(word)}
                      >
                        {word}
                      </span>
                      {punctuation && <span>{punctuation}</span>}
                    </span>
                  );
                } else {
                  // Fallback for tokens that don't match expected pattern
                  return (
                    <span key={`${paragraphIndex}-${tokenIndex}`}>
                      <span
                        className="clickable-word cursor-pointer hover:bg-yellow-200 rounded px-1"
                        onClick={() => onWordClick(token)}
                      >
                        {token}
                      </span>
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

interface ProcessingSummaryProps {
  isVisible: boolean;
  summaryId: number | null;
  summaries: Summaries | null;
  currentGradeLevel: GradeLevel;
  inputText: string;
  selectedGradeLevel: number;
  outputType: 'summary' | 'retelling';
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
  selectedGradeLevel,
  outputType,
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

  // Mutation for processing text to generate summaries
  const processTextMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/process-single-grade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: inputText,
          gradeLevel: selectedGradeLevel,
          outputType: outputType
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process text');
      }

      return response.json();
    },
    onSuccess: (data) => {
      onProcessingComplete(data.summaryId, data.summaries);
    },
    onError: (error) => {
      console.error('Processing error:', error);
      toast({
        title: 'Processing Error',
        description: error instanceof Error ? error.message : 'Failed to process text. Please try again.',
        variant: 'destructive'
      });
    }
  });

  // Trigger the API call when isProcessing becomes true
  useEffect(() => {
    if (isProcessing && !summaryId) {
      processTextMutation.mutate();
    }
  }, [isProcessing, processTextMutation, summaryId]);

  // Animation for the progress bar with faster, more responsive pacing
  useEffect(() => {
    if (processTextMutation.isPending) {
      // Reset progress when starting
      setProgressWidth(0);

      // Create a faster, more responsive progress simulation
      const simulateProgress = () => {
        // Initial progress (0-25%)
        const initialProgress = setInterval(() => {
          setProgressWidth(prev => {
            if (prev >= 25) {
              clearInterval(initialProgress);
              return 25;
            }
            return prev + 1;
          });
        }, 100);

        // Progress (25-50%)
        setTimeout(() => {
          const slowProgress = setInterval(() => {
            setProgressWidth(prev => {
              if (prev >= 50) {
                clearInterval(slowProgress);
                return 50;
              }
              return prev + 0.5;
            });
          }, 150);
        }, 2500);

        // Progress (50-75%)
        setTimeout(() => {
          const verySlowProgress = setInterval(() => {
            setProgressWidth(prev => {
              if (prev >= 75) {
                clearInterval(verySlowProgress);
                return 75;
              }
              return prev + 0.3;
            });
          }, 180);
        }, 5000);

        // Final progress (75-85%)
        setTimeout(() => {
          const finalProgress = setInterval(() => {
            setProgressWidth(prev => {
              if (prev >= 85) {
                clearInterval(finalProgress);
                return 85;
              }
              return prev + 0.2;
            });
          }, 250);
        }, 10000);
      };

      simulateProgress();

      return () => {
        // Clear any lingering intervals on cleanup
        const highId = window.setTimeout(() => {}, 0);
        for (let i = highId; i >= 0; i--) {
          if (i !== highId) window.clearInterval(i);
        }
      };
    } else if (!processTextMutation.isPending && isProcessing) {
      // Complete the progress bar when done
      setProgressWidth(100);
    }
  }, [processTextMutation.isPending, isProcessing]);

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
    <div className="col-span-1 lg:col-span-2 bg-white/80 backdrop-blur-sm border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg p-6">
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
      {!processTextMutation.isPending && summaries && (
        <div>
          {/* Grade Level Display */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Reading Level:
              </label>
              <div className="px-3 py-2 bg-[#4285F4] text-white rounded-lg text-sm font-medium">
                {selectedGradeLevel}{getGradeSuffix(selectedGradeLevel)} Grade
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

          <div className="p-4 bg-gray-100 rounded-lg max-h-64 overflow-y-auto font-['Merriweather'] text-gray-800 leading-relaxed whitespace-pre-wrap">
            {summaries[selectedGradeLevel] ? (
              <DisplayTextWithFixes 
                text={summaries[selectedGradeLevel]}
                onWordClick={onWordClick}
              />
            ) : (
              <p>No {outputType} available.</p>
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