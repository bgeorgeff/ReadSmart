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
    const syllables: string[] = [];
    let currentSyllable = '';
    let letterIndex = 0;
    
    // Track which phonemes correspond to which letters
    const wordChars = word.split('');
    
    for (let i = 0; i < phonemes.length; i++) {
      const phoneme = phonemes[i];
      const basePhoneme = phoneme.replace(/[0-2]$/, '');
      const stress = phoneme.match(/[0-2]$/)?.[0];
      
      // If this is a vowel phoneme, it marks a syllable boundary
      if (this.VOWEL_PHONEMES.has(basePhoneme)) {
        // Add letters for this syllable
        const syllableLetters = this.estimateLettersForSyllable(wordChars, letterIndex, i, phonemes.length);
        currentSyllable += syllableLetters.join('');
        letterIndex += syllableLetters.length;
        
        // If we have a current syllable, finish it
        if (currentSyllable) {
          syllables.push(currentSyllable);
          currentSyllable = '';
        }
      }
    }
    
    // Add any remaining letters to the last syllable
    if (letterIndex < wordChars.length) {
      const remaining = wordChars.slice(letterIndex).join('');
      if (syllables.length > 0) {
        syllables[syllables.length - 1] += remaining;
      } else {
        syllables.push(remaining);
      }
    }
    
    // Fallback: if no syllables were created, return the whole word
    if (syllables.length === 0) {
      return [word];
    }
    
    return syllables;
  }

  private estimateLettersForSyllable(wordChars: string[], startIndex: number, phonemeIndex: number, totalPhonemes: number): string[] {
    // Simple heuristic: distribute letters proportionally based on phoneme position
    const remainingLetters = wordChars.length - startIndex;
    const remainingPhonemes = totalPhonemes - phonemeIndex;
    
    if (remainingPhonemes <= 1) {
      return wordChars.slice(startIndex);
    }
    
    // Take roughly 1/3 to 1/2 of remaining letters for this syllable
    const lettersToTake = Math.max(1, Math.floor(remainingLetters / remainingPhonemes));
    return wordChars.slice(startIndex, startIndex + lettersToTake);
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



