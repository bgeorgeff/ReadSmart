import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { WordDetailResponse } from '@/types';
import { useTextToSpeech } from '@/hooks/use-text-to-speech';

interface SimpleWordModalProps {
  isOpen: boolean;
  word: string | null;
  onClose: () => void;
}

export default function SimpleWordModal({ isOpen, word, onClose }: SimpleWordModalProps) {
  const { speak, stopSpeaking } = useTextToSpeech();
  
  // Word detail query
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/word', word, 'v3'], // Add version to force cache refresh
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
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      {/* Modal */}
      <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-sm relative z-10" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-[#4285F4] text-white px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold">Word Details</h3>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white"
            aria-label="Close"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex flex-col items-center py-8">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p>Loading word details...</p>
            </div>
          ) : error ? (
            <div className="text-center text-red-500">
              <p>Failed to load word details.</p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          ) : data?.success ? (
            <div>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">{data.word}</h2>
                
                {/* Pronounce button moved up */}
                <button
                  onClick={() => speak(data.word)}
                  className="mt-3 text-blue-500 hover:text-blue-700 flex items-center justify-center mx-auto text-sm"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1">
                    <path d="M11 5L6 9H2V15H6L11 19V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M15.54 8.46C16.4774 9.39764 17.0039 10.6692 17.0039 11.995C17.0039 13.3208 16.4774 14.5924 15.54 15.53" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Pronounce
                </button>
                
              </div>
              
              <div className="mt-4">
                <h4 className="font-['Google_Sans'] text-sm uppercase text-gray-500 mb-2">Definition</h4>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-gray-800">{data.definition}</p>
                </div>
                <button
                  onClick={() => speak(data.definition)}
                  className="mt-2 text-sm text-blue-500 hover:text-blue-700 flex items-center"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1">
                    <path d="M11 5L6 9H2V15H6L11 19V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M15.54 8.46C16.4774 9.39764 17.0039 10.6692 17.0039 11.995C17.0039 13.3208 16.4774 14.5924 15.54 15.53" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Listen to definition
                </button>
              </div>

              <div className="mt-4">
                <h4 className="font-['Google_Sans'] text-sm uppercase text-gray-500 mb-2">Example</h4>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-gray-800">{data.exampleSentence}</p>
                </div>
                <button
                  onClick={() => speak(data.exampleSentence)}
                  className="mt-2 text-sm text-green-600 hover:text-green-700 flex items-center"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1">
                    <path d="M11 5L6 9H2V15H6L11 19V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M15.54 8.46C16.4774 9.39764 17.0039 10.6692 17.0039 11.995C17.0039 13.3208 16.4774 14.5924 15.54 15.53" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Listen to example
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <p>No details available for "{word}"</p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 p-4 flex justify-center border-t">
          <button
            onClick={onClose}
            className="w-1/2 py-2 bg-[#4285F4] text-white rounded-md hover:bg-[#4285F4]/90 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}