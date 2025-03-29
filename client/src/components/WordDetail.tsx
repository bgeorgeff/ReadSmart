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
  const { speak } = useTextToSpeech();
  const [syllables, setSyllables] = useState<string[]>([]);
  const [pronunciation, setPronunciation] = useState('');
  
  // Fetch word details
  const { data, error, isLoading } = useQuery({
    queryKey: word ? [`/api/word/${word}`] : null,
    enabled: !!word && isOpen, // Only run when we have a word and modal is open
  });
  
  useEffect(() => {
    if (data) {
      const response = data as WordDetailResponse;
      if (response.success) {
        setSyllables(response.syllables);
        setPronunciation(response.pronunciation);
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to get word details',
          variant: 'destructive'
        });
      }
    }
    
    if (error) {
      toast({
        title: 'Error',
        description: (error as Error).message || 'Failed to get word details',
        variant: 'destructive'
      });
    }
  }, [data, error, toast]);
  
  const handlePlayPronunciation = () => {
    if (word) {
      speak(word);
    }
  };
  
  if (!isOpen || !word) return null;
  
  // Function to generate a phonetic representation (simplified)
  const getPhoneticRepresentation = (word: string) => {
    return syllables.join('·');
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-['Google_Sans'] text-xl font-bold text-gray-800">{word}</h3>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>
            <span className="material-icons">close</span>
          </button>
        </div>
        
        {isLoading ? (
          <div className="py-4 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#4285F4]"></div>
            <p className="mt-2 font-['Roboto'] text-gray-500">Loading word details...</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-2 font-['Roboto']">Syllables:</p>
              <div className="flex flex-wrap gap-2">
                {syllables.map((syllable, index) => (
                  <div 
                    key={index} 
                    className="bg-[#4285F4]/10 rounded-full px-3 py-1 text-[#4285F4] font-medium"
                  >
                    {syllable}
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 mb-2 font-['Roboto']">Pronunciation:</p>
              <div className="bg-gray-100 p-3 rounded-lg flex items-center justify-between">
                <span className="font-['Google_Sans'] text-gray-800 italic">
                  {getPhoneticRepresentation(word)}
                </span>
                <button 
                  className="bg-[#4285F4] text-white p-2 rounded-full"
                  onClick={handlePlayPronunciation}
                >
                  <span className="material-icons">volume_up</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
