import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Zap } from 'lucide-react';
import { FeedbackModal } from './FeedbackModal';

export function FloatingFeedbackButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="fixed right-6 top-1/2 transform -translate-y-1/2 z-40">
        <Button
          onClick={() => setIsModalOpen(true)}
          className="group relative bg-gradient-to-r from-red-500 via-orange-500 to-red-600 hover:from-red-600 hover:via-orange-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 rounded-full p-4 h-auto animate-pulse hover:animate-none"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-orange-400 rounded-full blur opacity-40 group-hover:opacity-60 transition-opacity duration-300"></div>
          
          <div className="relative flex items-center space-x-2">
            <MessageCircle className="w-5 h-5" />
            <span className="font-semibold text-sm hidden sm:inline">Feedback</span>
            <Zap className="w-4 h-4 opacity-80" />
          </div>
          
          {/* Notification dot */}
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-bounce"></div>
        </Button>
        
        {/* Tooltip */}
        <div className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
            Share your thoughts!
            <div className="absolute left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-l-gray-900"></div>
          </div>
        </div>
      </div>

      <FeedbackModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}