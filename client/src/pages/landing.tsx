
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Volume2, Zap } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">ReadSmart</span>
            </div>
            <Link href="/app">
              <Button variant="outline">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Make Any Text Easy to Read
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Transform complex texts into grade-appropriate summaries. Perfect for students, educators, and anyone who wants to understand difficult material.
          </p>
          <Link href="/app">
            <Button size="lg" className="text-lg px-8 py-3">
              Start Reading Smarter
            </Button>
          </Link>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Simplification</h3>
              <p className="text-gray-600">
                Advanced AI creates 12 different grade-level versions of any text, from 1st grade to 12th grade complexity.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Interactive Reading</h3>
              <p className="text-gray-600">
                Click any word for instant definitions and pronunciation help. Perfect for vocabulary building.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Volume2 className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Audio Features</h3>
              <p className="text-gray-600">
                Listen to any text with text-to-speech or record yourself reading for practice and improvement.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
