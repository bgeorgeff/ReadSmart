import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AppStep } from '@/types';

interface TextInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  setAppStep: (step: AppStep) => void;
  isVisible: boolean;
}

export default function TextInput({ 
  inputText, 
  setInputText, 
  setAppStep, 
  isVisible
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
