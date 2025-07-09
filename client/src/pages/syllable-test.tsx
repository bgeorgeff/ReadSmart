
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SyllableTest() {
  const [word, setWord] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testWord = async () => {
    if (!word.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/word/${encodeURIComponent(word.trim())}`);
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error testing word:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      testWord();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Syllable Tester</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={word}
              onChange={(e) => setWord(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter a word to test"
              className="flex-1"
            />
            <Button onClick={testWord} disabled={loading || !word.trim()}>
              {loading ? 'Testing...' : 'Test'}
            </Button>
          </div>
          
          {result && (
            <Card>
              <CardContent className="pt-6">
                {result.success ? (
                  <div className="space-y-2">
                    <div className="text-lg font-semibold">{result.word}</div>
                    <div className="text-xl text-blue-600">
                      {result.syllables.join(' • ')}
                    </div>
                    <div className="text-sm text-gray-600">
                      Definition: {result.definition}
                    </div>
                    <div className="text-sm text-gray-500 italic">
                      Example: {result.exampleSentence}
                    </div>
                  </div>
                ) : (
                  <div className="text-red-600">Error: {result.message}</div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
