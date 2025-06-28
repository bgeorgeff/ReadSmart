import { useState } from 'react';
import AppHeader from '@/components/AppHeader';
import ProcessSteps from '@/components/ProcessSteps';
import TextInput from '@/components/TextInput';
import ProcessingSummary from '@/components/ProcessingSummary';
import ReadingTools from '@/components/ReadingTools';
import SimpleWordModal from '@/components/SimpleWordModal';

import { AppStep, GradeLevel, Summaries } from '@/types';

export default function Home() {
  const [appStep, setAppStep] = useState<AppStep>(AppStep.TEXT_INPUT);
  const [inputText, setInputText] = useState('');
  const [summaryId, setSummaryId] = useState<number | null>(null);
  const [summaries, setSummaries] = useState<Summaries | null>(null);
  const [currentGradeLevel, setCurrentGradeLevel] = useState<GradeLevel>(5);
  const [selectedSummary, setSelectedSummary] = useState<string>('');
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [isWordDetailOpen, setIsWordDetailOpen] = useState(false);

  // Function to handle text processing completion
  const handleProcessingComplete = (newSummaryId: number, newSummaries: Summaries) => {
    setSummaryId(newSummaryId);
    setSummaries(newSummaries);

    // If current grade level is 0, show original text
    if (currentGradeLevel === 0) {
      setSelectedSummary(inputText);
    } else {
      setSelectedSummary(newSummaries[currentGradeLevel]);
    }

    setAppStep(AppStep.SUMMARY);
  };

  // Function to handle grade level change
  const handleGradeLevelChange = (gradeLevel: GradeLevel) => {
    setCurrentGradeLevel(gradeLevel);
    // If grade level is 0, show the original text
    if (gradeLevel === 0) {
      setSelectedSummary(inputText);
    } else if (summaries) {
      // Otherwise show the appropriate summary
      setSelectedSummary(summaries[gradeLevel]);
    }
  };

  // Function to handle word click
  const handleWordClick = (word: string) => {
    setSelectedWord(word);
    setIsWordDetailOpen(true);
  };

  // Function to close word detail modal
  const handleCloseWordDetail = () => {
    setIsWordDetailOpen(false);
  };

  // Function to continue to reading step
  const handleContinueToReading = () => {
    setAppStep(AppStep.READING);
  };

  // Function to go back to summary
  const handleBackToSummary = () => {
    setAppStep(AppStep.SUMMARY);
  };
  
  // Function to handle reading tools navigation
  const handleReadingToolsNavigation = () => {
    setAppStep(AppStep.READING);
  };

  // Function to handle back navigation
  const handleBackNavigation = () => {
    if (appStep === AppStep.READING) {
      setAppStep(AppStep.SUMMARY);
    } else if (appStep === AppStep.SUMMARY) {
      setAppStep(AppStep.TEXT_INPUT);
      // Reset state when going back to text input
      setSummaryId(null);
      setSummaries(null);
      setSelectedSummary('');
    }
  };

  return (
    <div className="bg-neutral-100 min-h-screen">
      <AppHeader />

      <main className="container mx-auto px-4 py-8">
        <ProcessSteps 
          currentStep={appStep} 
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Text Input Component */}
          <TextInput 
            inputText={inputText}
            setInputText={setInputText}
            setAppStep={setAppStep}
            isVisible={appStep === AppStep.TEXT_INPUT}
          />

          {/* Summary Component */}
          <ProcessingSummary 
            isVisible={appStep === AppStep.SUMMARY || appStep === AppStep.PROCESSING}
            summaryId={summaryId}
            summaries={summaries}
            currentGradeLevel={currentGradeLevel}
            inputText={inputText}
            onGradeLevelChange={handleGradeLevelChange}
            onWordClick={handleWordClick}
            onContinueToReading={handleReadingToolsNavigation}
            onNavigateBack={handleBackNavigation}
            onProcessingComplete={handleProcessingComplete}
            showBackButton={appStep !== AppStep.TEXT_INPUT}
          />
        </div>

        {/* Reading Tools */}
        <ReadingTools 
          isVisible={appStep === AppStep.READING}
          summaryId={summaryId}
          selectedSummary={selectedSummary}
          onWordClick={handleWordClick}
          onBackToSummary={() => setAppStep(AppStep.SUMMARY)}
          onNavigateBack={handleBackNavigation}
          showBackButton={appStep !== AppStep.TEXT_INPUT}
        />

        {/* Word Detail Modal */}
        <SimpleWordModal 
          isOpen={isWordDetailOpen}
          word={selectedWord}
          onClose={handleCloseWordDetail}
        />
      </main>
    </div>
  );
}