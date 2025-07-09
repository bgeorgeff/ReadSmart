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
    
    const vowels = 'aeiouAEIOU';
    const wordChars = word.split('');
    const syllables: string[] = [];
    let currentSyllable = '';
    let vowelsSeen = 0;
    
    for (let i = 0; i < wordChars.length; i++) {
      const char = wordChars[i];
      const isVowel = vowels.includes(char);
      
      // Add character to current syllable
      currentSyllable += char;
      
      // If this is a vowel, we're in a vowel cluster
      if (isVowel) {
        // Check if this starts a new vowel cluster
        const prevChar = wordChars[i - 1];
        const isPrevVowel = prevChar && vowels.includes(prevChar);
        
        if (!isPrevVowel) {
          vowelsSeen++;
        }
        
        // Look ahead to decide where to split
        const nextChar = wordChars[i + 1];
        const nextNextChar = wordChars[i + 2];
        
        // If we have enough vowels seen and there's more content
        if (vowelsSeen < syllableCount && nextChar) {
          // Split strategy: 
          // 1. If next is consonant followed by vowel, split before consonant
          // 2. If next is vowel, continue current syllable
          
          if (!vowels.includes(nextChar)) { // next is consonant
            if (nextNextChar && vowels.includes(nextNextChar)) {
              // Consonant followed by vowel - split here
              syllables.push(currentSyllable);
              currentSyllable = '';
            } else if (i + 2 < wordChars.length) {
              // Look further ahead for better split point
              const nextNextNextChar = wordChars[i + 3];
              if (nextNextNextChar && vowels.includes(nextNextNextChar)) {
                // Split after next consonant
                currentSyllable += nextChar;
                i++; // Skip the consonant we just added
                syllables.push(currentSyllable);
                currentSyllable = '';
              }
            }
          }
        }
      }
    }
    
    // Add final syllable
    if (currentSyllable) {
      if (syllables.length > 0) {
        syllables[syllables.length - 1] += currentSyllable;
      } else {
        syllables.push(currentSyllable);
      }
    }
    
    // Ensure we have the right number of syllables
    if (syllables.length < syllableCount && syllables.length > 0) {
      // Try to split the longest syllable
      const longestIndex = syllables.reduce((maxIndex, current, index, array) => 
        current.length > array[maxIndex].length ? index : maxIndex, 0);
      
      const longestSyllable = syllables[longestIndex];
      if (longestSyllable.length > 3) {
        const midPoint = Math.floor(longestSyllable.length / 2);
        const firstPart = longestSyllable.slice(0, midPoint);
        const secondPart = longestSyllable.slice(midPoint);
        
        syllables[longestIndex] = firstPart;
        syllables.splice(longestIndex + 1, 0, secondPart);
      }
    }
    
    return syllables.length > 0 ? syllables : [word];
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



