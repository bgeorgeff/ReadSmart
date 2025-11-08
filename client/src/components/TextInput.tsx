import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AppStep } from '@/types';
import * as pdfjsLib from 'pdfjs-dist';

interface TextInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  setAppStep: (step: AppStep) => void;
  isVisible: boolean;
  setSummaries?: (summaries: any) => void;
  setSummaryId?: (id: number | null) => void;
  setSelectedGradeLevel?: (level: number) => void;
}

// Use jsdelivr CDN for the worker - more reliable than cdnjs
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

export default function TextInput({ 
  inputText, 
  setInputText, 
  setAppStep, 
  isVisible,
  setSummaries,
  setSummaryId,
  setSelectedGradeLevel
}: TextInputProps) {
  const [characterCount, setCharacterCount] = useState(0);
  const [isProcessingPDF, setIsProcessingPDF] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    setAppStep(AppStep.TEXT_INPUT);
    if (setSummaries) setSummaries(null);
    if (setSummaryId) setSummaryId(null);
    if (setSelectedGradeLevel) setSelectedGradeLevel(5);
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

  const handlePDFUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: 'Invalid File',
        description: 'Please upload a PDF file.',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessingPDF(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let extractedText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        extractedText += pageText + '\n\n';
      }

      if (extractedText.trim().length === 0) {
        toast({
          title: 'Empty PDF',
          description: 'No text could be extracted from this PDF.',
          variant: 'destructive'
        });
        setIsProcessingPDF(false);
        return;
      }

      setInputText(extractedText);
      setCharacterCount(extractedText.length);

      setAppStep(AppStep.PROCESSING);

      const response = await fetch('/api/process-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: extractedText }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to process text');
      }

      const data = await response.json();

      if (data.success && setSummaries && setSummaryId) {
        setSummaries(data.summaries);
        setSummaryId(data.summaryId);
        setAppStep(AppStep.SUMMARY);
      }

    } catch (error) {
      console.error('PDF processing error:', error);
      toast({
        title: 'Error Processing PDF',
        description: 'Failed to extract or process text from PDF. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessingPDF(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  if (!isVisible) return null;

  return (
    <div className="bg-white/80 backdrop-blur-sm border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <h3 className="font-['Google_Sans'] text-lg font-medium text-gray-800">1. Copy & Paste Any Text</h3>
          <span className="font-['Google_Sans'] text-lg font-medium text-gray-800">or</span>
          <button
            type="button"
            onClick={handleUploadClick}
            disabled={isProcessingPDF}
            className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white py-2 px-4 rounded-lg font-['Google_Sans'] text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
            data-testid="button-upload-pdf"
          >
            {isProcessingPDF ? (
              <>
                <span className="material-icons text-sm animate-spin">refresh</span>
                Processing PDF...
              </>
            ) : (
              <>
                <span className="material-icons text-sm">picture_as_pdf</span>
                Upload PDF
              </>
            )}
          </button>
        </div>
        <div className="h-[40px] flex items-center">
          {inputText.trim().length > 0 && (
            <button 
              className="bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 px-4 py-2 rounded-lg font-['Google_Sans'] text-sm font-medium transition-all duration-200 hover:bg-gray-50"
              onClick={handleClear}
            >
              Clear Text
            </button>
          )}
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        accept="application/pdf"
        onChange={handlePDFUpload}
        className="hidden"
        data-testid="input-pdf-file"
      />

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