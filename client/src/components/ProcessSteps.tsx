import { AppStep } from '@/types';

interface ProcessStepsProps {
  currentStep: AppStep;
  onStepClick?: (step: AppStep) => void;
}

export default function ProcessSteps({ currentStep, onStepClick }: ProcessStepsProps) {
  const isActiveStep = (step: AppStep) => currentStep === step;
  const isPastStep = (step: AppStep, current: AppStep) => {
    const steps = [AppStep.TEXT_INPUT, AppStep.PROCESSING, AppStep.SUMMARY, AppStep.READING];
    return steps.indexOf(step) < steps.indexOf(current);
  };

  // For steps 2 and 3, we consider them active in different app states
  const isStep2Active = currentStep === AppStep.PROCESSING || currentStep === AppStep.SUMMARY;
  const isStep3Active = currentStep === AppStep.READING;



  return (
    <div className="py-4">
      <div className="flex justify-start items-center">
        <div className="flex items-center">
          <button 
            className={`h-8 w-8 rounded-full flex items-center justify-center font-bold mr-2 transition-colors hover:opacity-80 ${
              isActiveStep(AppStep.TEXT_INPUT) || isPastStep(AppStep.TEXT_INPUT, currentStep) 
                ? 'bg-[#4285F4] text-white' 
                : 'bg-gray-200 text-gray-400'
            }`}
            onClick={() => onStepClick?.(AppStep.TEXT_INPUT)}
          >1</button>
          <p className={`mr-4 font-['Google_Sans'] ${
            isActiveStep(AppStep.TEXT_INPUT) || isPastStep(AppStep.TEXT_INPUT, currentStep) 
              ? 'text-gray-800' 
              : 'text-gray-400'
          }`}>Begin</p>
        </div>
        <div className="flex items-center">
          <button 
            className={`h-8 w-8 rounded-full flex items-center justify-center font-bold mr-2 transition-colors hover:opacity-80 ${
              isStep2Active || isPastStep(AppStep.SUMMARY, currentStep) 
                ? 'bg-[#4285F4] text-white' 
                : 'bg-gray-200 text-gray-400'
            }`}
            onClick={() => onStepClick?.(AppStep.SUMMARY)}
          >2</button>
          <p className={`mr-4 font-['Google_Sans'] ${
            isStep2Active || isPastStep(AppStep.SUMMARY, currentStep) 
              ? 'text-gray-800' 
              : 'text-gray-400'
          }`}>Summarize</p>
        </div>
        <div className="flex items-center">
          <button 
            className={`h-8 w-8 rounded-full flex items-center justify-center font-bold mr-2 transition-colors hover:opacity-80 ${
              isStep3Active 
                ? 'bg-[#4285F4] text-white' 
                : 'bg-gray-200 text-gray-400'
            }`}
            onClick={() => onStepClick?.(AppStep.READING)}
          >3</button>
          <p className={`mr-4 font-['Google_Sans'] ${
            isStep3Active 
              ? 'text-gray-800' 
              : 'text-gray-400'
          }`}>Read</p>
        </div>
      </div>
    </div>
  );
}