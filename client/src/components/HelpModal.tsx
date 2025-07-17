import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookOpen, Volume2, VolumeX, X } from "lucide-react";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const { speak, stopSpeaking, isSpeaking } = useTextToSpeech();

  const handleSpeakerClick = (sectionText: string) => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speak(sectionText);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#4285F4] flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            How to Use ReadSmart
          </DialogTitle>
          <DialogDescription className="sr-only">
            Learn how to use ReadSmart's features for text comprehension and reading improvement
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {/* Getting Started */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <button 
                onClick={() => handleSpeakerClick("Getting Started. 1. Paste your text in the input box on the main page. 2. Click Summarize to generate summaries at 12 different reading levels. 3. Choose a grade level to find a summary that looks comfortable. 4. Click read for interactive features.")}
                className="text-[#4285F4] hover:text-[#3367D6] transition-colors"
                aria-label={isSpeaking ? "Stop reading" : "Listen to Getting Started section"}
              >
                {isSpeaking ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
              Getting Started
            </h3>
            <div className="space-y-2 text-gray-600">
              <p>1. <strong>Paste your text</strong> in the input box on the main page.</p>
              <p>2. <strong>Click "Summarize"</strong> to generate summaries at 12 different reading levels.</p>
              <p>3. <strong>Choose a grade level</strong> to find a summary that looks comfortable.</p>
              <p>4. <strong>Click "Read"</strong> for interactive features.</p>
            </div>
          </section>

          {/* Understanding Grade Levels */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <button 
                onClick={() => handleSpeakerClick("Understanding Grade Levels. Grades 1-2: Very simple language, short sentences. Grades 3-5: Elementary level with basic vocabulary. Grades 6-8: Middle school level with more complex ideas. Grades 9-12: High school level with advanced concepts.")}
                className="text-[#4285F4] hover:text-[#3367D6] transition-colors"
                aria-label={isSpeaking ? "Stop reading" : "Listen to Understanding Grade Levels section"}
              >
                {isSpeaking ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
              Understanding Grade Levels
            </h3>
            <div className="bg-blue-50 p-4 rounded-lg space-y-2 text-sm">
              <p><strong>Grades 1-2:</strong> Very simple language, short sentences.</p>
              <p><strong>Grades 3-5:</strong> Elementary level with basic vocabulary.</p>
              <p><strong>Grades 6-8:</strong> Middle school level with more complex ideas.</p>
              <p><strong>Grades 9-12:</strong> High school level with advanced concepts.</p>
            </div>
          </section>

          {/* Interactive Features */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <button 
                onClick={() => handleSpeakerClick("Interactive Features. Click any word to see its definition, pronunciation, and example sentence. Use the audio button to hear words or text read aloud. Navigate back and forth between summary and reading tools.")}
                className="text-[#4285F4] hover:text-[#3367D6] transition-colors"
                aria-label={isSpeaking ? "Stop reading" : "Listen to Interactive Features section"}
              >
                {isSpeaking ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
              Interactive Features
            </h3>
            <div className="space-y-2 text-gray-600">
              <p><strong>Click any word</strong> to hear its pronunciation and definition.</p>
              <p><strong>Use the audio button</strong> to hear words or text read aloud.</p>
              <p><strong>Navigate back and forth</strong> between summary and reading tools.</p>
            </div>
          </section>

          {/* Tips for Success */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <button 
                onClick={() => handleSpeakerClick("Tips for Success. Start with a grade level that feels comfortable, then try higher levels. Use the word lookup feature to build your vocabulary. Listen to pronunciation to improve speaking skills. Try different types of text: news articles, stories, or educational content.")}
                className="text-[#4285F4] hover:text-[#3367D6] transition-colors"
                aria-label={isSpeaking ? "Stop reading" : "Listen to Tips for Success section"}
              >
                {isSpeaking ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
              Tips for Success
            </h3>
            <div className="space-y-2 text-gray-600">
              <p>• Start with a grade level that feels comfortable, then try higher levels.</p>
              <p>• Use the word lookup feature to build your vocabulary.</p>
              <p>• Listen to pronunciation to improve speaking skills.</p>
              <p>• Try different types of text: news articles, stories, or educational content.</p>
            </div>
          </section>

          {/* Sample Text */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <button 
                onClick={() => handleSpeakerClick("Try This Sample Text")}
                className="text-[#4285F4] hover:text-[#3367D6] transition-colors"
                aria-label={isSpeaking ? "Stop reading" : "Listen to section heading"}
              >
                {isSpeaking ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
              Copy this Sample Text to Paste into the App
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700">
              <p className="italic">
                In addition to being the first president of the United States, George Washington was an agricultural innovator and pioneer. Throughout his life, he exhibited a keen interest and eye for useful technologies. He established himself as an innovative farmer, who switched from tobacco to wheat as his main cash crop in the 1760s. In an effort to improve his farming operation, he diligently experimented with new crops, fertilizers, crop rotation, tools, and livestock breeding. Leveraging a fine donkey sent to him as a gift from the King of Spain, Washington became one of the foremost breeders and promoters of the American mule. As president, Washington signed the patent for a new automated mill technology. Intrigued by the design, Washington had Oliver Evans' automated mill technology installed in his gristmill. He also found time to design a 16-sided, two-story threshing barn that greatly improved the process of separating wheat from chaff.
              </p>
            </div>
            </section>

          <div className="flex justify-center">
            <Button 
              onClick={onClose}
              className="bg-[#4285F4] hover:bg-[#3367D6] text-white px-8 py-2"
            >
              Got it! Let's get started!
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}