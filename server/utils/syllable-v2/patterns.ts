/**
 * Common Syllable Patterns Module
 * Defines and applies common syllabification patterns
 */

export interface SyllablePattern {
  name: string;
  pattern: RegExp;
  priority: number;
  action: 'split' | 'keep' | 'custom';
  description: string;
  examples: string[];
  customHandler?: (match: RegExpMatchArray, word: string) => number[]; // Returns split positions
}

// Common syllable patterns in English
export const SYLLABLE_PATTERNS: SyllablePattern[] = [
  // CVCe pattern (consonant-vowel-consonant-silent e)
  {
    name: 'CVCe',
    pattern: /[^aeiou][aeiou][^aeiou]e$/gi,
    priority: 1,
    action: 'keep',
    description: 'Silent e pattern makes preceding vowel long',
    examples: ['make', 'time', 'hope', 'cute']
  },
  
  // VCV pattern (vowel-consonant-vowel)
  {
    name: 'VCV',
    pattern: /[aeiou][^aeiou][aeiou]/gi,
    priority: 2,
    action: 'custom',
    description: 'Split before or after consonant based on open/closed preference',
    examples: ['ti-ger', 'cab-in', 'mo-ment'],
    customHandler: (match, word) => {
      const matchStart = match.index!;
      // Default: split before consonant (open syllable)
      return [matchStart + 1];
    }
  },
  
  // VCCV pattern (vowel-consonant-consonant-vowel)
  {
    name: 'VCCV',
    pattern: /[aeiou][^aeiou]{2}[aeiou]/gi,
    priority: 2,
    action: 'custom',
    description: 'Split between consonants unless they form a blend',
    examples: ['rab-bit', 'nap-kin', 'bas-ket'],
    customHandler: (match, word) => {
      const matchStart = match.index!;
      // Split between the consonants
      return [matchStart + 2];
    }
  },
  
  // VV pattern (vowel-vowel) - hiatus
  {
    name: 'VV',
    pattern: /[aeiou]{2}/gi,
    priority: 3,
    action: 'custom',
    description: 'Two vowels that are separate sounds',
    examples: ['po-et', 'di-et', 'qui-et'],
    customHandler: (match, word) => {
      const matchStart = match.index!;
      const vowelPair = match[0].toLowerCase();
      
      // Common diphthongs that stay together
      const diphthongs = ['ai', 'ay', 'ea', 'ee', 'oa', 'oo', 'ou', 'oi', 'oy'];
      if (diphthongs.includes(vowelPair)) {
        return []; // Don't split
      }
      
      // Otherwise split between vowels
      return [matchStart + 1];
    }
  },
  
  // Consonant + le pattern
  {
    name: 'ConsonantLE',
    pattern: /[^aeiou]le$/gi,
    priority: 1,
    action: 'custom',
    description: 'Consonant + le forms a syllable',
    examples: ['ta-ble', 'ap-ple', 'lit-tle'],
    customHandler: (match, word) => {
      const matchStart = match.index!;
      // Split before consonant+le
      return [matchStart];
    }
  },
  
  // R-controlled vowels
  {
    name: 'RControlled',
    pattern: /[aeiou]r[^aeiou]/gi,
    priority: 2,
    action: 'keep',
    description: 'Vowel + r stays together',
    examples: ['car', 'her', 'bird', 'corn', 'fur']
  }
];

export class PatternEngine {
  private patterns: SyllablePattern[];
  
  constructor() {
    // Sort patterns by priority
    this.patterns = [...SYLLABLE_PATTERNS].sort((a, b) => a.priority - b.priority);
  }
  
  /**
   * Apply patterns to find syllable boundaries
   */
  findPatternBoundaries(word: string): number[] {
    const boundaries = new Set<number>();
    
    for (const pattern of this.patterns) {
      const matches = [...word.matchAll(pattern.pattern)];
      
      for (const match of matches) {
        if (pattern.action === 'custom' && pattern.customHandler) {
          const splitPositions = pattern.customHandler(match, word);
          splitPositions.forEach(pos => boundaries.add(pos));
        } else if (pattern.action === 'split') {
          // Split at pattern location
          if (match.index !== undefined) {
            boundaries.add(match.index + Math.floor(match[0].length / 2));
          }
        }
        // 'keep' action means don't add any boundaries
      }
    }
    
    return Array.from(boundaries).sort((a, b) => a - b);
  }
  
  /**
   * Check if a position conflicts with a pattern that should be kept together
   */
  conflictsWithPattern(word: string, position: number): boolean {
    for (const pattern of this.patterns) {
      if (pattern.action === 'keep') {
        const matches = [...word.matchAll(pattern.pattern)];
        for (const match of matches) {
          if (match.index !== undefined &&
              position > match.index &&
              position < match.index + match[0].length) {
            return true;
          }
        }
      }
    }
    return false;
  }
  
  /**
   * Get pattern information for educational purposes
   */
  identifyPatterns(word: string): Array<{pattern: string, positions: number[]}> {
    const identified: Array<{pattern: string, positions: number[]}> = [];
    
    for (const pattern of this.patterns) {
      const matches = [...word.matchAll(pattern.pattern)];
      if (matches.length > 0) {
        identified.push({
          pattern: pattern.name,
          positions: matches.map(m => m.index!).filter(i => i !== undefined)
        });
      }
    }
    
    return identified;
  }
}