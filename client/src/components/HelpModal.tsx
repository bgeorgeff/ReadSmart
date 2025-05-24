import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookOpen, Target, MousePointer, Volume2, X } from "lucide-react";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-[#4285F4] flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
              How to Use ReadSmart
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription className="sr-only">
            Learn how to use ReadSmart's features for text comprehension and reading improvement
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {/* Getting Started */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Target className="h-5 w-5 text-[#4285F4]" />
              Getting Started
            </h3>
            <div className="space-y-2 text-gray-600">
              <p>1. <strong>Paste or type your text</strong> in the input box on the main page</p>
              <p>2. <strong>Click "Process Text"</strong> to generate summaries at different reading levels</p>
              <p>3. <strong>Choose your grade level</strong> to see a summary that matches your reading ability</p>
              <p>4. <strong>Click "Continue to Reading Tools"</strong> for interactive features</p>
            </div>
          </section>

          {/* Understanding Grade Levels */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Understanding Grade Levels</h3>
            <div className="bg-blue-50 p-4 rounded-lg space-y-2 text-sm">
              <p><strong>Grades 0-2:</strong> Very simple language, short sentences</p>
              <p><strong>Grades 3-5:</strong> Elementary level with basic vocabulary</p>
              <p><strong>Grades 6-8:</strong> Middle school level with more complex ideas</p>
              <p><strong>Grades 9-12:</strong> High school level with advanced concepts</p>
            </div>
          </section>

          {/* Interactive Features */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <MousePointer className="h-5 w-5 text-[#4285F4]" />
              Interactive Features
            </h3>
            <div className="space-y-2 text-gray-600">
              <p><strong>Click any word</strong> to see its definition, pronunciation, and example sentence</p>
              <p><strong>Use the audio button</strong> to hear words or text read aloud</p>
              <p><strong>Navigate back and forth</strong> between summary and reading tools</p>
            </div>
          </section>

          {/* Tips for Success */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-[#4285F4]" />
              Tips for Success
            </h3>
            <div className="space-y-2 text-gray-600">
              <p>• Start with a grade level that feels comfortable, then try higher levels</p>
              <p>• Use the word lookup feature to build your vocabulary</p>
              <p>• Listen to pronunciation to improve speaking skills</p>
              <p>• Try different types of text: news articles, stories, or educational content</p>
            </div>
          </section>

          {/* Sample Text */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Try This Sample Text</h3>
            <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700">
              <p className="italic">
                "The water cycle is the continuous movement of water on, above, and below the surface of the Earth. Water evaporates from oceans, lakes, and rivers, forming water vapor that rises into the atmosphere. As the water vapor cools, it condenses into tiny droplets that form clouds. When the droplets become heavy enough, they fall as precipitation in the form of rain, snow, or hail, completing the cycle."
              </p>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Copy this text to try out all the features!
            </p>
          </section>

          <div className="pt-4 border-t">
            <Button 
              onClick={onClose}
              className="w-full bg-[#4285F4] hover:bg-[#3367D6] text-white"
            >
              Got it! Let's get started
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}