/**
 * Fallback Syllabification Module
 * Basic CV rules for words not in dictionary or when other methods fail
 */

export class FallbackSyllabifier {
  private vowels = 'aeiouAEIOU';
  
  /**
   * Basic syllable splitting using simple CV patterns
   */
  basicSyllableSplit(word: string): string[] {
    if (word.length <= 3) {
      return [word]; // Short words are single syllables
    }
    
    const syllables: string[] = [];
    let currentSyllable = '';
    let previousWasVowel = false;
    
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      const isVowel = this.isVowel(char, word, i);
      
      if (isVowel && previousWasVowel) {
        // Two vowels in a row - check if diphthong
        const twoVowels = word[i-1] + char;
        if (this.isDiphthong(twoVowels.toLowerCase())) {
          currentSyllable += char;
        } else {
          // Start new syllable
          syllables.push(currentSyllable);
          currentSyllable = char;
        }
      } else if (!isVowel && !previousWasVowel && currentSyllable.length > 0) {
        // Consonant cluster
        if (i < word.length - 1 && this.isVowel(word[i + 1], word, i + 1)) {
          // Next is vowel, check where to split
          if (this.shouldSplitBeforeConsonant(currentSyllable, char)) {
            syllables.push(currentSyllable);
            currentSyllable = char;
          } else {
            currentSyllable += char;
          }
        } else {
          currentSyllable += char;
        }
      } else {
        currentSyllable += char;
      }
      
      previousWasVowel = isVowel;
    }
    
    // Add remaining syllable
    if (currentSyllable) {
      syllables.push(currentSyllable);
    }
    
    // Post-process to ensure each syllable has a vowel
    return this.ensureVowelsInSyllables(syllables);
  }
  
  /**
   * Split based on vowel count estimate
   */
  splitByVowelCount(word: string, targetSyllableCount: number): string[] {
    const vowelPositions = this.findVowelPositions(word);
    
    if (vowelPositions.length === 0) {
      return [word];
    }
    
    if (vowelPositions.length === 1) {
      return [word];
    }
    
    // Distribute syllables evenly
    const syllables: string[] = [];
    const syllableLength = Math.ceil(word.length / targetSyllableCount);
    
    for (let i = 0; i < word.length; i += syllableLength) {
      const end = Math.min(i + syllableLength, word.length);
      syllables.push(word.slice(i, end));
    }
    
    return this.ensureVowelsInSyllables(syllables);
  }
  
  /**
   * Emergency fallback - single syllable
   */
  singleSyllableFallback(word: string): string[] {
    return [word];
  }
  
  private isVowel(char: string, word: string, position: number): boolean {
    // Check standard vowels
    if (this.vowels.includes(char)) {
      return true;
    }
    
    // Y is vowel when not at start and not followed by vowel
    if (char.toLowerCase() === 'y' && position > 0) {
      if (position === word.length - 1) {
        return true; // Y at end is vowel
      }
      if (position < word.length - 1 && !this.vowels.includes(word[position + 1])) {
        return true; // Y before consonant is vowel
      }
    }
    
    return false;
  }
  
  private isDiphthong(twoLetters: string): boolean {
    const commonDiphthongs = [
      'ai', 'ay', 'ea', 'ee', 'ei', 'ey',
      'oa', 'oe', 'oi', 'oo', 'ou', 'ow', 'oy',
      'au', 'aw', 'ew', 'ie', 'ue', 'ui'
    ];
    return commonDiphthongs.includes(twoLetters);
  }
  
  private shouldSplitBeforeConsonant(currentSyllable: string, consonant: string): boolean {
    // If current syllable has a vowel, consider splitting
    const hasVowel = [...currentSyllable].some((char, i) => 
      this.isVowel(char, currentSyllable, i)
    );
    
    return hasVowel && currentSyllable.length >= 2;
  }
  
  private findVowelPositions(word: string): number[] {
    const positions: number[] = [];
    for (let i = 0; i < word.length; i++) {
      if (this.isVowel(word[i], word, i)) {
        positions.push(i);
      }
    }
    return positions;
  }
  
  private ensureVowelsInSyllables(syllables: string[]): string[] {
    const result: string[] = [];
    let accumulated = '';
    
    for (const syllable of syllables) {
      const hasVowel = [...syllable].some((char, i) => 
        this.isVowel(char, syllable, i)
      );
      
      if (hasVowel) {
        if (accumulated) {
          // Attach accumulated consonants to this syllable
          result.push(accumulated + syllable);
          accumulated = '';
        } else {
          result.push(syllable);
        }
      } else {
        // No vowel, accumulate
        accumulated += syllable;
      }
    }
    
    // Handle any remaining accumulated consonants
    if (accumulated) {
      if (result.length > 0) {
        result[result.length - 1] += accumulated;
      } else {
        result.push(accumulated);
      }
    }
    
    return result.length > 0 ? result : [syllables.join('')];
  }
}