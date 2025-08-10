import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, Upload, X } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [email, setEmail] = useState('');
  const [feedbackType, setFeedbackType] = useState('');
  const [message, setMessage] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    if (!message || message.trim().length < 10) {
      toast({
        title: "Message Too Short",
        description: "Please provide at least 10 characters in your message",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_email: email,
          feedback_type: feedbackType || 'General Feedback',
          message: message.trim(),
          has_screenshot: !!screenshot,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Feedback Submitted! 🙏",
          description: "Thank you for helping us improve. We'll review your feedback soon.",
        });
        // Reset form
        setEmail('');
        setFeedbackType('');
        setMessage('');
        setScreenshot(null);
        onClose();
      } else {
        toast({
          title: "Submission Failed",
          description: data.message || "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Network Error",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select a file smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }
      
      setScreenshot(file);
    }
  };

  const removeScreenshot = () => {
    setScreenshot(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg border-0 bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
            <Send className="w-7 h-7 text-white" />
          </div>
          
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Share Your Feedback
          </DialogTitle>
          
          <p className="text-gray-600 text-sm">
            Help us improve! Your feedback is valuable and helps shape our product.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="feedback-email" className="text-sm font-medium text-gray-700">
              Email Address
            </Label>
            <Input
              id="feedback-email"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-gray-50 border-gray-200 focus:border-orange-400 focus:ring-orange-400"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback-type" className="text-sm font-medium text-gray-700">
              Feedback Type
            </Label>
            <Select value={feedbackType} onValueChange={setFeedbackType}>
              <SelectTrigger className="bg-gray-50 border-gray-200 focus:border-orange-400 focus:ring-orange-400">
                <SelectValue placeholder="Select feedback type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Bug Report">🐛 Bug Report</SelectItem>
                <SelectItem value="Feature Request">💡 Feature Request</SelectItem>
                <SelectItem value="General Feedback">💬 General Feedback</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-medium text-gray-700">
              Your Message
            </Label>
            <Textarea
              id="message"
              placeholder="Tell us what's on your mind... (minimum 10 characters)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="bg-gray-50 border-gray-200 focus:border-orange-400 focus:ring-orange-400 min-h-[100px] resize-none"
              required
            />
            <div className="text-xs text-gray-500 text-right">
              {message.length}/10 characters minimum
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Screenshot (Optional)
            </Label>
            
            {!screenshot ? (
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-orange-400 transition-colors duration-200">
                <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <div className="text-sm text-gray-600 mb-2">
                  Upload a screenshot to help us understand the issue
                </div>
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-md text-sm font-medium hover:bg-orange-200 transition-colors duration-200">
                    Choose File
                  </span>
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <div className="text-xs text-gray-500 mt-1">
                  PNG, JPG up to 5MB
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Upload className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{screenshot.name}</div>
                    <div className="text-xs text-gray-500">
                      {(screenshot.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeScreenshot}
                  className="text-gray-500 hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold transition-all duration-200 transform hover:scale-105"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Feedback
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}