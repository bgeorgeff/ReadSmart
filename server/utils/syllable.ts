// CMU Dictionary phoneme to syllable converter
class CMUSyllabifier {
  private dictionary: Map<string, string[]> = new Map();
  private initialized = false;

  // ARPAbet vowel phonemes that indicate syllable cores
  private readonly VOWEL_PHONEMES = new Set([
    'AA', 'AE', 'AH', 'AO', 'AW', 'AY', 'EH', 'ER', 'EY', 'IH', 'IY', 'OW', 'OY', 'UH', 'UW'
  ]);

  async initialize() {
    if (this.initialized) return;
    
    try {
      // Fetch CMU dictionary data
      const response = await fetch('https://raw.githubusercontent.com/Alexir/CMUdict/master/cmudict-0.7b');
      const text = await response.text();
      
      // Parse dictionary entries
      const lines = text.split('\n');
      for (const line of lines) {
        // Skip comments and empty lines
        if (line.startsWith(';;;') || line.trim() === '') continue;
        
        // Parse entry format: WORD PHONEME1 PHONEME2 ...
        const parts = line.trim().split(/\s+/);
        if (parts.length < 2) continue;
        
        const word = parts[0].toLowerCase();
        const phonemes = parts.slice(1);
        
        // Handle variant pronunciations like WORD(1), WORD(2) etc.
        const baseWord = word.replace(/\(\d+\)$/, '');
        
        // Convert phonemes to syllables
        const syllables = this.phonemesToSyllables(baseWord, phonemes);
        
        // Store in dictionary (prefer first pronunciation if multiple exist)
        if (!this.dictionary.has(baseWord)) {
          this.dictionary.set(baseWord, syllables);
        }
      }
      
      this.initialized = true;
      console.log(`CMU Dictionary initialized with ${this.dictionary.size} entries`);
    } catch (error) {
      console.error('Failed to initialize CMU dictionary:', error);
      this.initialized = false;
    }
  }

  private phonemesToSyllables(word: string, phonemes: string[]): string[] {
    // Count syllables by counting vowel phonemes (each vowel = one syllable)
    const vowelCount = phonemes.filter(p => this.VOWEL_PHONEMES.has(p.replace(/[0-2]$/, ''))).length;
    
    if (vowelCount === 0) {
      return [word];
    }
    
    if (vowelCount === 1) {
      return [word];
    }
    
    // Use a more sophisticated approach for multi-syllable words
    return this.splitWordBySyllableCount(word, vowelCount);
  }

  private splitWordBySyllableCount(word: string, syllableCount: number): string[] {
    if (syllableCount <= 1) {
      return [word];
    }
    
    // Use established syllable division rules
    const vowels = 'aeiouAEIOU';
    const consonants = 'bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ';
    
    // Find vowel positions to identify syllable cores
    const vowelPositions: number[] = [];
    for (let i = 0; i < word.length; i++) {
      if (vowels.includes(word[i])) {
        // Check if this is a new vowel cluster (not consecutive vowels)
        if (i === 0 || !vowels.includes(word[i - 1])) {
          vowelPositions.push(i);
        }
      }
    }
    
    // If we don't have enough vowel clusters, fall back to simple splitting
    if (vowelPositions.length < syllableCount) {
      return this.simpleSyllableSplit(word, syllableCount);
    }
    
    // Apply syllable division rules
    const syllables: string[] = [];
    let currentStart = 0;
    
    for (let i = 0; i < vowelPositions.length - 1; i++) {
      const currentVowelPos = vowelPositions[i];
      const nextVowelPos = vowelPositions[i + 1];
      
      // Find consonants between vowels
      let consonantStart = currentVowelPos + 1;
      while (consonantStart < nextVowelPos && vowels.includes(word[consonantStart])) {
        consonantStart++;
      }
      
      let consonantEnd = nextVowelPos - 1;
      while (consonantEnd > consonantStart && vowels.includes(word[consonantEnd])) {
        consonantEnd--;
      }
      
      // Determine split point based on consonant count
      const consonantCount = consonantEnd - consonantStart + 1;
      let splitPoint: number;
      
      if (consonantCount <= 1) {
        // Single consonant or no consonant: split before consonant
        splitPoint = consonantStart;
      } else {
        // Multiple consonants: split between consonants
        // For better pronunciation, keep consonant clusters together when possible
        if (consonantCount === 2) {
          // Two consonants: split between them
          splitPoint = consonantStart + 1;
        } else {
          // Three or more consonants: split after first consonant
          splitPoint = consonantStart + 1;
        }
      }
      
      // Extract syllable
      const syllable = word.slice(currentStart, splitPoint);
      if (syllable) {
        syllables.push(syllable);
      }
      currentStart = splitPoint;
    }
    
    // Add the final syllable
    const finalSyllable = word.slice(currentStart);
    if (finalSyllable) {
      syllables.push(finalSyllable);
    }
    
    // Adjust if we have too many or too few syllables
    return this.adjustSyllableCount(syllables, syllableCount);
  }
  
  private simpleSyllableSplit(word: string, targetCount: number): string[] {
    const syllables: string[] = [];
    const avgLength = Math.ceil(word.length / targetCount);
    
    for (let i = 0; i < targetCount; i++) {
      const start = i * avgLength;
      const end = i === targetCount - 1 ? word.length : (i + 1) * avgLength;
      const syllable = word.slice(start, end);
      if (syllable) {
        syllables.push(syllable);
      }
    }
    
    return syllables;
  }
  
  private adjustSyllableCount(syllables: string[], targetCount: number): string[] {
    if (syllables.length === targetCount) {
      return syllables;
    }
    
    if (syllables.length < targetCount) {
      // Need to split some syllables
      while (syllables.length < targetCount) {
        const longestIndex = syllables.reduce((maxIdx, current, idx, array) => 
          current.length > array[maxIdx].length ? idx : maxIdx, 0);
        
        const longest = syllables[longestIndex];
        if (longest.length <= 2) break; // Can't split further
        
        const midPoint = Math.floor(longest.length / 2);
        const firstPart = longest.slice(0, midPoint);
        const secondPart = longest.slice(midPoint);
        
        syllables[longestIndex] = firstPart;
        syllables.splice(longestIndex + 1, 0, secondPart);
      }
    } else {
      // Need to merge some syllables
      while (syllables.length > targetCount) {
        const shortestIndex = syllables.reduce((minIdx, current, idx, array) => 
          current.length < array[minIdx].length ? idx : minIdx, 0);
        
        if (shortestIndex === 0) {
          syllables[0] += syllables[1];
          syllables.splice(1, 1);
        } else {
          syllables[shortestIndex - 1] += syllables[shortestIndex];
          syllables.splice(shortestIndex, 1);
        }
      }
    }
    
    return syllables;
  }



  async breakWordIntoSyllables(word: string): Promise<string[]> {
    await this.initialize();
    
    // Clean the word from punctuation
    const cleanWord = word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");

    // Handle empty or very short words
    if (!cleanWord || cleanWord.length <= 2) {
      return [cleanWord];
    }

    // Look up in CMU dictionary
    const syllables = this.dictionary.get(cleanWord);
    if (syllables) {
      return syllables;
    }

    // Fallback for words not in dictionary: use simple vowel-based splitting
    return this.fallbackSyllabification(cleanWord);
  }

  private fallbackSyllabification(word: string): string[] {
    // Simple fallback: split on vowel clusters
    const vowels = 'aeiouAEIOU';
    const syllables: string[] = [];
    let currentSyllable = '';
    
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      currentSyllable += char;
      
      // If this is a vowel and the next character is a consonant (or end of word)
      if (vowels.includes(char)) {
        const nextChar = word[i + 1];
        if (!nextChar || !vowels.includes(nextChar)) {
          // Look ahead to see if we should split here
          const nextNextChar = word[i + 2];
          if (nextChar && nextNextChar && vowels.includes(nextNextChar)) {
            // Split before the next consonant
            syllables.push(currentSyllable);
            currentSyllable = '';
          }
        }
      }
    }
    
    // Add any remaining characters to the last syllable
    if (currentSyllable) {
      if (syllables.length > 0) {
        syllables[syllables.length - 1] += currentSyllable;
      } else {
        syllables.push(currentSyllable);
      }
    }
    
    return syllables.length > 0 ? syllables : [word];
  }
}

// Global instance
const cmuSyllabifier = new CMUSyllabifier();

export async function breakWordIntoSyllables(word: string): Promise<string[]> {
  return cmuSyllabifier.breakWordIntoSyllables(word);
}



