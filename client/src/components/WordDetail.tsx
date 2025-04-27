import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { WordDetailResponse } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useTextToSpeech } from '@/hooks/use-text-to-speech';

interface WordDetailProps {
  isOpen: boolean;
  word: string | null;
  onClose: () => void;
}

export default function WordDetail({ isOpen, word, onClose }: WordDetailProps) {
  const { toast } = useToast();
  const { speak, stopSpeaking } = useTextToSpeech();
  
  // Word detail query
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/word', word],
    queryFn: async () => {
      if (!word) return null;
      
      const response = await fetch(`/api/word/${encodeURIComponent(word)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch word details');
      }
      return await response.json() as WordDetailResponse;
    },
    enabled: !!word && isOpen,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
  
  // Stop speaking when modal closes and add keyboard support
  useEffect(() => {
    if (!isOpen) {
      stopSpeaking();
      return;
    }
    
    // Add keyboard support for closing modal with Escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, stopSpeaking, onClose]);
  
  if (!isOpen) return null;
  
  // Handle pronunciation
  const handlePronounce = () => {
    if (word) {
      speak(word);
    }
  };
  
  return (
    <div 
      className="fixed inset-0 bg-black/25 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose} // Close when clicking outside the modal
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside modal from closing it
      >
        {/* Header */}
        <div className="bg-[#4285F4] text-white px-6 py-4 flex items-center justify-between">
          <h3 className="font-['Google_Sans'] text-xl">Word Details</h3>
          <button 
            className="text-white/80 hover:text-white"
            onClick={onClose}
          >
            <span className="material-icons">close</span>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="py-8 flex flex-col items-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#4285F4] mb-4"></div>
              <p className="text-gray-500">Loading word details...</p>
            </div>
          ) : error ? (
            <div className="py-4 text-center">
              <p className="text-[#EA4335]">Could not fetch word details.</p>
              <button 
                className="mt-2 text-[#4285F4] hover:underline text-sm"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          ) : data && data.success ? (
            <div>
              <div className="mb-6 text-center">
                <h2 className="font-['Google_Sans'] text-2xl text-gray-800 mb-1">{data.word}</h2>
                <div className="flex items-center justify-center">
                  <p className="text-gray-500 font-['Roboto'] text-sm mr-2">/{data.pronunciation}/</p>
                  <button 
                    className="text-[#4285F4] hover:bg-[#4285F4]/10 p-1 rounded-full"
                    onClick={handlePronounce}
                  >
                    <span className="material-icons text-sm">volume_up</span>
                  </button>
                </div>
              </div>
              
              <div>
                <div className="mb-4">
                  <h4 className="font-['Google_Sans'] text-sm uppercase text-gray-500 mb-2">Definition</h4>
                  <div className="bg-[#4285F4]/5 p-3 rounded-lg mb-1">
                    <p className="text-gray-800">{data.definition}</p>
                  </div>
                  <button 
                    className="text-[#4285F4] text-xs flex items-center hover:underline"
                    onClick={() => speak(data.definition)}
                  >
                    <span className="material-icons text-sm mr-1">volume_up</span>
                    Listen
                  </button>
                </div>
                
                <div className="mb-4">
                  <h4 className="font-['Google_Sans'] text-sm uppercase text-gray-500 mb-2">Example</h4>
                  <div className="bg-[#34A853]/5 p-3 rounded-lg mb-1">
                    <p className="text-gray-800">{data.exampleSentence}</p>
                  </div>
                  <button 
                    className="text-[#34A853] text-xs flex items-center hover:underline"
                    onClick={() => speak(data.exampleSentence)}
                  >
                    <span className="material-icons text-sm mr-1">volume_up</span>
                    Listen
                  </button>
                </div>
                
                <p className="text-sm text-center text-gray-500 mt-4">
                  Click any listen button to hear the word, definition, or example
                </p>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center">
              <p className="text-gray-500">No details available for "{word}"</p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 flex justify-end">
          <button 
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg font-['Google_Sans']"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}