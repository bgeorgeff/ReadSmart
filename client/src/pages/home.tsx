import { useState } from "react";
import AppHeader from "@/components/AppHeader";
import ProcessSteps from "@/components/ProcessSteps";
import TextInput from "@/components/TextInput";
import ProcessingSummary from "@/components/ProcessingSummary";
import ReadingTools from "@/components/ReadingTools";
import SimpleWordModal from "@/components/SimpleWordModal";

import { AppStep, GradeLevel, Summaries } from "@/types";

export default function Home() {
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.TEXT_INPUT);
  const [inputText, setInputText] = useState<string>('');
  const [summaryId, setSummaryId] = useState<number | null>(null);
  const [summaries, setSummaries] = useState<Summaries | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(5);
  const [selectedSummary, setSelectedSummary] = useState<string>('');
  const [clickedWord, setClickedWord] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<number>(5);
  const [outputType, setOutputType] = useState<'summary' | 'retelling'>('summary');

  const handleStepClick = (step: AppStep) => {
    if (step === AppStep.TEXT_INPUT) {
      setCurrentStep(AppStep.TEXT_INPUT);
    } else if (step === AppStep.SUMMARY) {
      if (summaryId) {
        setCurrentStep(AppStep.SUMMARY);
      } else if (inputText.trim().length > 0) {
        // If we have input text but no summaries, trigger processing
        setCurrentStep(AppStep.PROCESSING);
      }
    } else if (step === AppStep.READING && summaries) {
      // Set the selected summary based on the grade level used for processing
      const summary = summaries[selectedGradeLevel];
      setSelectedSummary(summary || '');
      setCurrentStep(AppStep.READING);
    }
  };

  const handleWordClick = (word: string) => {
    setClickedWord(word);
  };

  const handleCloseWordDetail = () => {
    setClickedWord(null);
  };

  const handleBackToSummary = () => {
    setCurrentStep(AppStep.SUMMARY);
  };

  const handleNavigateBack = () => {
    if (currentStep === AppStep.READING) {
      setCurrentStep(AppStep.SUMMARY);
    } else if (currentStep === AppStep.SUMMARY) {
      setCurrentStep(AppStep.TEXT_INPUT);
    }
  };

  const handleProcessingComplete = (summaryId: number, summaries: Summaries) => {
    setSummaryId(summaryId);
    setSummaries(summaries);
    setCurrentStep(AppStep.SUMMARY);
  };

  const handleContinueToReading = () => {
    if (summaries) {
      // In the new single-grade system, use the selectedGradeLevel that was used for processing
      const summary = summaries[selectedGradeLevel];
      setSelectedSummary(summary || '');
      setCurrentStep(AppStep.READING);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background Graphics */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-pink-600/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-300/10 to-blue-500/10 rounded-full blur-3xl"></div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-1/4 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-indigo-500 rounded-full animate-bounce"></div>
        <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%236366f1%22%20fill-opacity%3D%220.03%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>
      </div>

      {/* Header with backdrop blur */}
      <div className="relative z-10">
        <AppHeader />
        <div className="bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm">
          <div className="container mx-auto px-4">
            <ProcessSteps 
              currentStep={currentStep} 
              onStepClick={handleStepClick}
            />
          </div>
        </div>
      </div>

      <main className="relative z-10 container mx-auto px-4 py-8">

        <div className="max-w-4xl mx-auto">
          <TextInput 
            inputText={inputText}
            setInputText={setInputText}
            setAppStep={setCurrentStep}
            isVisible={currentStep === AppStep.TEXT_INPUT}
            selectedGradeLevel={selectedGradeLevel}
            setSelectedGradeLevel={setSelectedGradeLevel}
            outputType={outputType}
            setOutputType={setOutputType}
          />

          <ProcessingSummary 
            inputText={inputText}
            isVisible={currentStep === AppStep.PROCESSING || currentStep === AppStep.SUMMARY}
            summaryId={summaryId}
            summaries={summaries}
            currentGradeLevel={selectedGrade}
            selectedGradeLevel={selectedGradeLevel}
            outputType={outputType}
            onGradeLevelChange={setSelectedGrade}
            onWordClick={handleWordClick}
            onContinueToReading={handleContinueToReading}
            onNavigateBack={handleNavigateBack}
            onProcessingComplete={handleProcessingComplete}
          />

          <ReadingTools 
            isVisible={currentStep === AppStep.READING}
            summaryId={summaryId}
            selectedSummary={selectedSummary}
            onWordClick={handleWordClick}
            onBackToSummary={handleBackToSummary}
            onNavigateBack={handleNavigateBack}
          />
        </div>
      </main>

      {clickedWord && (
        <SimpleWordModal 
          isOpen={!!clickedWord}
          word={clickedWord}
          onClose={handleCloseWordDetail}
        />
      )}
    </div>
  );
}