/**
 * Core Syllabification Orchestrator
 * Coordinates all modules to provide accurate educational syllabification
 */

import { VowelDetector } from './vowel-detector.js';
import { MorphologicalAnalyzer } from './morphological.js';
import { PhoneticProcessor } from './phonetic.js';
import { PatternEngine } from './patterns.js';
import { FallbackSyllabifier } from './fallback.js';

export interface SyllabificationResult {
  syllables: string[];
  method: 'cmu' | 'pattern' | 'fallback';
  confidence: number;
  debug?: {
    phonemes?: string[];
    morphemes?: any[];
    patterns?: any[];
    vowelSounds?: any[];
  };
}

export class CMUSyllabifierV2 {
  private dictionary: Map<string, string[]> = new Map();
  private initialized = false;
  
  // Module instances
  private vowelDetector: VowelDetector;
  private morphAnalyzer: MorphologicalAnalyzer;
  private phoneticProcessor: PhoneticProcessor;
  private patternEngine: PatternEngine;
  private fallbackSyllabifier: FallbackSyllabifier;
  
  // CMU phoneme data
  private readonly VOWEL_PHONEMES = new Set([
    'AA', 'AE', 'AH', 'AO', 'AW', 'AY', 'EH', 'ER', 'EY', 
    'IH', 'IY', 'OW', 'OY', 'UH', 'UW'
  ]);
  
  // Performance cache
  private cache: Map<string, SyllabificationResult> = new Map();
  
  constructor() {
    this.vowelDetector = new VowelDetector();
    this.morphAnalyzer = new MorphologicalAnalyzer();
    this.phoneticProcessor = new PhoneticProcessor();
    this.patternEngine = new PatternEngine();
    this.fallbackSyllabifier = new FallbackSyllabifier();
  }
  
  async initialize() {
    if (this.initialized) return;
    
    try {
      // Fetch CMU dictionary data from URL like V1 does
      const response = await fetch('https://raw.githubusercontent.com/Alexir/CMUdict/master/cmudict-0.7b');
      const dictContent = await response.text();
      const lines = dictContent.split('\n');
      
      for (const line of lines) {
        // Skip comments and empty lines
        if (line.startsWith(';;;') || line.trim() === '') continue;
        
        const parts = line.trim().split(/\s+/);
        if (parts.length < 2) continue;
        
        const word = parts[0];
        const phonemes = parts.slice(1);
        
        // Remove variant markers (1), (2), etc.
        const cleanWord = word.replace(/\(\d+\)$/, '').toLowerCase();
        this.dictionary.set(cleanWord, phonemes);
      }
      
      this.initialized = true;
      console.log(`CMU Dictionary V2 initialized with ${this.dictionary.size} entries`);
    } catch (error) {
      console.error('Failed to initialize CMU dictionary:', error);
      this.initialized = true; // Continue with fallback methods
    }
  }
  
  /**
   * Main syllabification method
   */
  async syllabify(word: string): Promise<SyllabificationResult> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    // Check cache first
    const cacheKey = word.toLowerCase();
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    // Try CMU dictionary first
    const phonemes = this.dictionary.get(cacheKey);
    if (phonemes) {
      const result = this.syllabifyWithPhonemes(word, phonemes);
      this.cache.set(cacheKey, result);
      return result;
    }
    
    // Try pattern-based syllabification
    const patternResult = this.syllabifyWithPatterns(word);
    if (patternResult.confidence > 0.7) {
      this.cache.set(cacheKey, patternResult);
      return patternResult;
    }
    
    // Fallback to basic rules
    const fallbackResult = this.syllabifyWithFallback(word);
    this.cache.set(cacheKey, fallbackResult);
    return fallbackResult;
  }
  
  /**
   * Syllabify using CMU phoneme data
   */
  private syllabifyWithPhonemes(word: string, phonemes: string[]): SyllabificationResult {
    // 1. Detect vowel sounds
    const vowelSounds = this.vowelDetector.detectVowelSounds(word, phonemes);
    const vowelCount = this.vowelDetector.countVowelSounds(vowelSounds);
    
    // 2. Get morphological hints
    const morphHints = this.morphAnalyzer.getMorphologicalHints(word);
    
    // 3. Build syllables
    const syllables: string[] = [];
    let currentPos = 0;
    
    // Handle preserved morphological units first
    for (const unit of morphHints.preservedUnits) {
      if (unit.start > currentPos) {
        // Process gap before this unit
        const gapText = word.slice(currentPos, unit.start);
        const gapSyllables = this.processTextSegment(gapText, phonemes, vowelSounds);
        syllables.push(...gapSyllables);
      }
      
      // Add preserved unit syllables
      syllables.push(...unit.syllables);
      currentPos = unit.end;
    }
    
    // Process any remaining text
    if (currentPos < word.length) {
      const remainingText = word.slice(currentPos);
      const remainingSyllables = this.processTextSegment(remainingText, phonemes, vowelSounds);
      syllables.push(...remainingSyllables);
    }
    
    // Special handling for -ed suffix
    if (word.endsWith('ed') && syllables.length > 0) {
      const rootWord = word.slice(0, -2);
      const edHandling = this.morphAnalyzer.handleEdSuffix(rootWord);
      
      if (edHandling.length === 0) {
        // -ed should join with previous syllable
        const lastSyllable = syllables[syllables.length - 1];
        if (!lastSyllable.endsWith('ed')) {
          syllables[syllables.length - 1] = lastSyllable + 'ed';
        }
      }
    }
    
    return {
      syllables: this.validateSyllables(syllables, word),
      method: 'cmu',
      confidence: 0.95,
      debug: {
        phonemes,
        morphemes: morphHints.preservedUnits,
        vowelSounds
      }
    };
  }
  
  /**
   * Process a text segment without morphological boundaries
   */
  private processTextSegment(text: string, phonemes: string[], vowelSounds: any[]): string[] {
    if (!text) return [];
    
    const phoneticHints = this.phoneticProcessor.getPhoneticHints(text);
    const patternBoundaries = this.patternEngine.findPatternBoundaries(text);
    
    // Combine all boundaries
    const allBoundaries = new Set([
      ...phoneticHints.splitPoints,
      ...patternBoundaries
    ]);
    
    // Filter out conflicting boundaries
    const validBoundaries = Array.from(allBoundaries)
      .filter(pos => !this.patternEngine.conflictsWithPattern(text, pos))
      .sort((a, b) => a - b);
    
    // Build syllables from boundaries
    const syllables: string[] = [];
    let start = 0;
    
    for (const boundary of validBoundaries) {
      if (boundary > start && boundary < text.length) {
        syllables.push(text.slice(start, boundary));
        start = boundary;
      }
    }
    
    // Add remaining text
    if (start < text.length) {
      syllables.push(text.slice(start));
    }
    
    return syllables.length > 0 ? syllables : [text];
  }
  
  /**
   * Syllabify using pattern matching
   */
  private syllabifyWithPatterns(word: string): SyllabificationResult {
    const morphHints = this.morphAnalyzer.getMorphologicalHints(word);
    const patternBoundaries = this.patternEngine.findPatternBoundaries(word);
    const phoneticHints = this.phoneticProcessor.getPhoneticHints(word);
    
    // Combine boundaries with priority
    const allBoundaries = new Set([
      ...morphHints.boundaries,
      ...patternBoundaries,
      ...phoneticHints.splitPoints
    ]);
    
    const sortedBoundaries = Array.from(allBoundaries).sort((a, b) => a - b);
    
    // Build syllables
    const syllables: string[] = [];
    let start = 0;
    
    for (const boundary of sortedBoundaries) {
      if (boundary > start && boundary < word.length) {
        syllables.push(word.slice(start, boundary));
        start = boundary;
      }
    }
    
    if (start < word.length) {
      syllables.push(word.slice(start));
    }
    
    return {
      syllables: this.validateSyllables(syllables, word),
      method: 'pattern',
      confidence: 0.8,
      debug: {
        patterns: this.patternEngine.identifyPatterns(word),
        morphemes: morphHints.preservedUnits
      }
    };
  }
  
  /**
   * Fallback syllabification
   */
  private syllabifyWithFallback(word: string): SyllabificationResult {
    const syllables = this.fallbackSyllabifier.basicSyllableSplit(word);
    
    return {
      syllables: this.validateSyllables(syllables, word),
      method: 'fallback',
      confidence: 0.5
    };
  }
  
  /**
   * Validate and clean syllables
   */
  private validateSyllables(syllables: string[], originalWord: string): string[] {
    // Ensure syllables join back to original word
    const joined = syllables.join('');
    if (joined.toLowerCase() !== originalWord.toLowerCase()) {
      console.warn(`Syllable mismatch: ${joined} vs ${originalWord}`);
      return [originalWord]; // Safety fallback
    }
    
    // Ensure each syllable has a vowel
    const validSyllables = syllables.filter(syl => {
      const hasVowel = /[aeiouAEIOU]/.test(syl) || 
                      (syl.includes('y') && syl.length > 1);
      return hasVowel || syl.length === 1; // Single letters ok
    });
    
    return validSyllables.length > 0 ? validSyllables : [originalWord];
  }
}

// Export singleton instance
export const syllabifierV2 = new CMUSyllabifierV2();

// Export main function
export async function breakWordIntoSyllablesV2(word: string): Promise<string[]> {
  const result = await syllabifierV2.syllabify(word);
  return result.syllables;
}