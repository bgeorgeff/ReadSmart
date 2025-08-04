import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AppStep } from '@/types';

interface TextInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  setAppStep: (step: AppStep) => void;
  isVisible: boolean;
  selectedGradeLevel: number;
  setSelectedGradeLevel: (level: number) => void;
  outputTypes: ('summary' | 'retelling')[];
  setOutputTypes: (types: ('summary' | 'retelling')[]) => void;
}

export default function TextInput({ 
  inputText, 
  setInputText, 
  setAppStep, 
  isVisible, 
  selectedGradeLevel, 
  setSelectedGradeLevel,
  outputTypes,
  setOutputTypes 
}: TextInputProps) {
  const [characterCount, setCharacterCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  
  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = event.target.value;
    setInputText(text);
    setCharacterCount(text.length);
  };
  
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text);
      setCharacterCount(text.length);
      if (textareaRef.current) {
        textareaRef.current.value = text;
      }
    } catch (error) {
      console.error('Failed to read clipboard contents:', error);
      toast({
        title: 'Clipboard Error',
        description: 'Could not access clipboard. Please paste text manually.',
        variant: 'destructive'
      });
    }
  };
  
  const handleClear = () => {
    setInputText('');
    setCharacterCount(0);
    if (textareaRef.current) {
      textareaRef.current.value = '';
      textareaRef.current.focus();
    }
  };
  
  const handleProcessText = () => {
    if (inputText.trim().length === 0) {
      toast({
        title: 'Input Required',
        description: 'Please enter or paste some text to process.',
        variant: 'destructive'
      });
      return;
    }

    if (outputTypes.length === 0) {
      toast({
        title: 'Output Type Required',
        description: 'Please select at least one output type (Summary or Retelling).',
        variant: 'destructive'
      });
      return;
    }
    
    setAppStep(AppStep.PROCESSING);
  };
  
  if (!isVisible) return null;
  
  return (
    <div className="bg-white/80 backdrop-blur-sm border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg p-6">
      <h3 className="font-['Google_Sans'] text-lg font-medium mb-4 text-gray-800">1. Copy & Paste Any Text</h3>
      <div className="mb-4">
        <div className="relative">
          <textarea 
            ref={textareaRef}
            rows={12} 
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4285F4] font-['Roboto'] whitespace-pre-wrap"
            placeholder="Paste your text here..."
            onChange={handleInputChange}
            value={inputText}
            style={{ whiteSpace: 'pre-wrap' }}
          />
          <div className="absolute bottom-3 right-3">
            {inputText.trim().length === 0 && (
              <button 
                className="text-[#4285F4] hover:bg-[#4285F4]/10 p-2 rounded-full"
                onClick={handlePaste}
                aria-label="Paste from clipboard"
              >
                <span className="material-icons">content_paste</span>
              </button>
            )}
            {inputText.trim().length > 0 && (
              <button 
                className="text-gray-300 hover:text-[#EA4335] hover:bg-[#EA4335]/10 p-2 rounded-full"
                onClick={handleClear}
                aria-label="Clear text"
              >
                <span className="material-icons">clear</span>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Grade Level Selection */}
      <div className="mb-4">
        <label htmlFor="grade-level" className="block text-sm font-medium text-gray-700 mb-2">
          Select Desired Reading Level:
        </label>
        <select 
          id="grade-level"
          value={selectedGradeLevel}
          onChange={(e) => setSelectedGradeLevel(parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4285F4] font-['Roboto']"
        >
          <option value={1}>1st Grade (Age 6-7)</option>
          <option value={2}>2nd Grade (Age 7-8)</option>
          <option value={3}>3rd Grade (Age 8-9)</option>
          <option value={4}>4th Grade (Age 9-10)</option>
          <option value={5}>5th Grade (Age 10-11)</option>
          <option value={6}>6th Grade (Age 11-12)</option>
          <option value={7}>7th Grade (Age 12-13)</option>
          <option value={8}>8th Grade (Age 13-14)</option>
          <option value={9}>9th Grade (Age 14-15)</option>
          <option value={10}>10th Grade (Age 15-16)</option>
          <option value={11}>11th Grade (Age 16-17)</option>
          <option value={12}>12th Grade (Age 17-18)</option>
        </select>
      </div>

      {/* Output Type Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Choose Output Type:
        </label>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              value="summary"
              checked={outputTypes.includes('summary')}
              onChange={(e) => {
                if (e.target.checked) {
                  setOutputTypes([...outputTypes, 'summary']);
                } else {
                  setOutputTypes(outputTypes.filter(type => type !== 'summary'));
                }
              }}
              className="mr-2 text-[#4285F4] focus:ring-[#4285F4]"
            />
            <span className="text-sm text-gray-700">Summary</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              value="retelling"
              checked={outputTypes.includes('retelling')}
              onChange={(e) => {
                if (e.target.checked) {
                  setOutputTypes([...outputTypes, 'retelling']);
                } else {
                  setOutputTypes(outputTypes.filter(type => type !== 'retelling'));
                }
              }}
              className="mr-2 text-[#4285F4] focus:ring-[#4285F4]"
            />
            <span className="text-sm text-gray-700">Retelling</span>
          </label>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-400 font-['Roboto']">
          {characterCount} characters
        </span>
        <button 
          className="bg-[#4285F4] text-white py-2 px-6 rounded-full font-['Google_Sans'] flex items-center disabled:bg-gray-200 disabled:text-gray-400"
          onClick={handleProcessText}
          disabled={characterCount === 0}
        >
          <span className="material-icons mr-1">auto_fix_high</span>
          Process Text
        </button>
      </div>
    </div>
  );
}
