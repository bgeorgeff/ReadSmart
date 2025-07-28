
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Volume2, Zap, ArrowRight, Sparkles } from "lucide-react";
import pasteInterfaceImage from "@assets/image_1753676196480.png";
import readingPracticeImage from "@assets/image_1753673154787.png";
import originalTextImage from "@assets/image_1753674877843.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background Graphics */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-pink-600/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-300/10 to-blue-500/10 rounded-full blur-3xl"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-1/4 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-indigo-500 rounded-full animate-bounce"></div>
        <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%236366f1%22%20fill-opacity%3D%220.03%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-all duration-300 group">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">ReadSmart</span>
              </div>
            </Link>
            <Link href="/app">
              <Button variant="outline" className="bg-white/80 backdrop-blur-sm border-blue-500 hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 hover:-translate-y-1">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 container mx-auto px-4 py-16">
        <div className="text-center mb-20">
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center justify-center space-x-2 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full border border-white/30 shadow-lg">
              <Sparkles className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">AI-Powered Reading Assistant</span>
            </div>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold mb-8 leading-tight">
            <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent">
              Choose What
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent animate-pulse">
                  You
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-amber-400/20 via-orange-500/20 to-red-500/20 blur-lg animate-pulse"></span>
                <span className="absolute -inset-2 bg-gradient-to-r from-amber-400/10 via-orange-500/10 to-red-500/10 blur-xl animate-bounce"></span>
              </span>
              {' '}Want to Read!
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Turn complex texts from any website or PDF into readable chunks. Perfect for dyslexic adults/teens who want to practice their reading skills. Teachers and tutors also love it for helping older students.
          </p>
          
          <Link href="/app">
            <Button size="lg" className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-lg px-10 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              Start Reading Smarter
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </Link>
        </div>

        {/* Example Images */}
        <div className="mb-16 max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="group bg-white/80 backdrop-blur-sm border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 rounded-2xl overflow-hidden">
              <img 
                src="/assets/Motocross_1753657398829.jpg" 
                alt="Motocross Racing Tips - Example of complex text that can be simplified"
                className="w-full h-auto object-contain group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            
            <div className="group bg-white/80 backdrop-blur-sm border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 rounded-2xl overflow-hidden">
              <img 
                src="/assets/Literature_1753657393784.jpg" 
                alt="Classic Literature - Pride and Prejudice text that can be simplified"
                className="w-full h-auto object-contain group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
          

        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="group bg-white/80 backdrop-blur-sm border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Sparkles className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-gray-800">AI-Powered Simplification</h3>
              <p className="text-gray-600 leading-relaxed">
                Advanced AI creates 12 different grade-level versions of any text, from 1st to 12th grade level.
              </p>
            </CardContent>
          </Card>

          <Card className="group bg-white/80 backdrop-blur-sm border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <BookOpen className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Interactive Reading</h3>
              <p className="text-gray-600 leading-relaxed">
                Click any word to hear it, along with a definition and example sentence. Grow your vocabulary and comprehension!
              </p>
            </CardContent>
          </Card>

          <Card className="group bg-white/80 backdrop-blur-sm border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Volume2 className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Audio Features</h3>
              <p className="text-gray-600 leading-relaxed">
                Use text-to-speech to listen at different reading speeds, and then record yourself reading if you like.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Feature Interface Screenshots - Responsive Layout */}
        <div className="mt-16 max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Text Input & Paste Interface */}
            <div className="bg-white/80 backdrop-blur-sm border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 rounded-2xl overflow-hidden">
              <img 
                src={pasteInterfaceImage} 
                alt="ReadSmart text input and paste interface"
                className="w-full h-auto object-contain hover:scale-105 transition-transform duration-300"
              />
            </div>

            {/* AI Summaries Interface */}
            <div className="bg-white/80 backdrop-blur-sm border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 rounded-2xl overflow-hidden">
              <img 
                src="/assets/image_1753668381629.png" 
                alt="AI summaries interface showing grade selection and simplified text"
                className="w-full h-auto object-contain hover:scale-105 transition-transform duration-300"
              />
            </div>

            {/* Reading Practice Interface */}
            <div className="bg-white/80 backdrop-blur-sm border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 rounded-2xl overflow-hidden">
              <img 
                src={readingPracticeImage} 
                alt="Reading practice interface with simplified text and audio controls"
                className="w-full h-auto object-contain hover:scale-105 transition-transform duration-300"
              />
            </div>

            {/* Original Text Reading Interface */}
            <div className="bg-white/80 backdrop-blur-sm border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 rounded-2xl overflow-hidden">
              <img 
                src={originalTextImage} 
                alt="Original text reading interface with grade level selection"
                className="w-full h-auto object-contain hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-20">
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 border border-white/30 shadow-lg max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Ready to transform your reading experience?</h2>
            <p className="text-gray-600 mb-6">Say goodbye to "The Man in the Tan Van" and read about whatever you want from the web or docs from school or work.</p>
            <Link href="/app">
              <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                Get Started!
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
