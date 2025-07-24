/**
 * Phonetic Processing Module
 * Handles consonant clusters and sound-based rules
 */

// Consonant clusters that commonly start words
export const WORD_INITIAL_CLUSTERS = new Set([
  'bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr',
  'pl', 'pr', 'sc', 'sk', 'sl', 'sm', 'sn', 'sp', 'st',
  'sw', 'tr', 'tw', 'ch', 'sh', 'th', 'wh', 'ph',
  'scr', 'spl', 'spr', 'str', 'thr', 'shr', 'sch'
]);

// Consonant clusters that NEVER start English words
export const NEVER_INITIAL_CLUSTERS = new Set([
  'nt', 'nd', 'nk', 'mp', 'mb', 'ng', 'ld', 'rd',
  'ct', 'pt', 'ft', 'xt', 'lt', 'rt', 'rk', 'rm',
  'rn', 'rp', 'rs', 'rv', 'lf', 'lk', 'lm', 'lp',
  'ls', 'lt', 'lv', 'nc', 'nce', 'ns', 'ck'
]);

// Consonant digraphs that act as single sounds
export const CONSONANT_DIGRAPHS = new Set([
  'ch', 'sh', 'th', 'wh', 'ph', 'gh', 'ck', 'ng'
]);

// Special letter combinations
export const SPECIAL_COMBINATIONS = {
  // c + vowel rules
  'ci': { soundsLike: 's', examples: ['city', 'circle'] },
  'ce': { soundsLike: 's', examples: ['center', 'fence'] },
  'cy': { soundsLike: 's', examples: ['cycle', 'mercy'] },
  
  // g + vowel rules
  'gi': { soundsLike: 'j', examples: ['giant', 'magic'] },
  'ge': { soundsLike: 'j', examples: ['gentle', 'age'] },
  'gy': { soundsLike: 'j', examples: ['gym', 'energy'] }
};

export class PhoneticProcessor {
  /**
   * Apply consonant cluster rules for syllable division
   */
  applyConsonantClusterRules(word: string, clusterStart: number, clusterEnd: number): number {
    const cluster = word.slice(clusterStart, clusterEnd).toLowerCase();
    
    // Rule 1: Consonant digraphs stay together
    if (CONSONANT_DIGRAPHS.has(cluster)) {
      return clusterStart; // Keep together
    }
    
    // Rule 2: Check if cluster can start a word
    if (WORD_INITIAL_CLUSTERS.has(cluster)) {
      return clusterStart; // Keep together at start of next syllable
    }
    
    // Rule 3: Check if cluster cannot start a word
    if (NEVER_INITIAL_CLUSTERS.has(cluster)) {
      // Split after first consonant
      return clusterStart + 1;
    }
    
    // Rule 4: For longer clusters, check all possible splits
    if (cluster.length > 2) {
      // Try to find the best split point
      for (let i = 1; i < cluster.length; i++) {
        const leftPart = cluster.slice(0, i);
        const rightPart = cluster.slice(i);
        
        // If right part can start a word, split there
        if (WORD_INITIAL_CLUSTERS.has(rightPart)) {
          return clusterStart + i;
        }
        
        // If right part cannot start a word, continue
        if (NEVER_INITIAL_CLUSTERS.has(rightPart)) {
          continue;
        }
      }
    }
    
    // Default: Split after first consonant
    return clusterStart + 1;
  }
  
  /**
   * Check if a letter combination has special phonetic properties
   */
  hasSpecialSound(word: string, position: number, phonemes?: string[]): boolean {
    if (position >= word.length - 1) return false;
    
    const twoLetters = word.slice(position, position + 2).toLowerCase();
    
    // Check special combinations
    if (SPECIAL_COMBINATIONS[twoLetters as keyof typeof SPECIAL_COMBINATIONS]) {
      // If we have phoneme data, verify the sound
      if (phonemes && phonemes.length > 0) {
        // This would need phoneme mapping logic
        return true; // Simplified for now
      }
      return true;
    }
    
    return false;
  }
  
  /**
   * Determine if 'y' acts as a vowel
   */
  isYVowel(word: string, position: number): boolean {
    const letter = word[position].toLowerCase();
    if (letter !== 'y') return false;
    
    // Y is a vowel when:
    // 1. At the end of a word (except single letter words)
    if (position === word.length - 1 && word.length > 1) {
      return true;
    }
    
    // 2. Not at the beginning and surrounded by consonants
    if (position > 0) {
      const prevIsVowel = 'aeiou'.includes(word[position - 1].toLowerCase());
      const nextIsVowel = position < word.length - 1 && 
                         'aeiou'.includes(word[position + 1].toLowerCase());
      
      return !prevIsVowel && !nextIsVowel;
    }
    
    return false;
  }
  
  /**
   * Apply open syllable preference rules
   */
  preferOpenSyllable(word: string, vowelEnd: number, consonantCluster: string): boolean {
    // Prefer open syllables (ending in vowel) when:
    // 1. Single consonant between vowels
    if (consonantCluster.length === 1) {
      // Check if next syllable would have a vowel
      const nextPos = vowelEnd + 1;
      if (nextPos < word.length) {
        const nextChar = word[nextPos].toLowerCase();
        if ('aeiou'.includes(nextChar) || this.isYVowel(word, nextPos)) {
          return true; // Keep syllable open
        }
      }
    }
    
    // 2. Consonant + liquid (r, l) combinations
    if (consonantCluster.length === 2) {
      const secondChar = consonantCluster[1].toLowerCase();
      if (secondChar === 'r' || secondChar === 'l') {
        return false; // Keep cluster together
      }
    }
    
    return false;
  }
  
  /**
   * Get phonetic hints for syllabification
   */
  getPhoneticHints(word: string): { splitPoints: number[] } {
    const splitPoints: number[] = [];
    const vowels = 'aeiouAEIOU';
    
    for (let i = 0; i < word.length - 1; i++) {
      const currentIsVowel = vowels.includes(word[i]) || this.isYVowel(word, i);
      const nextIsVowel = vowels.includes(word[i + 1]) || this.isYVowel(word, i + 1);
      
      // VCV pattern
      if (currentIsVowel && !nextIsVowel) {
        // Find end of consonant cluster
        let clusterEnd = i + 1;
        while (clusterEnd < word.length && 
               !vowels.includes(word[clusterEnd]) && 
               !this.isYVowel(word, clusterEnd)) {
          clusterEnd++;
        }
        
        if (clusterEnd < word.length) {
          const splitPoint = this.applyConsonantClusterRules(word, i + 1, clusterEnd);
          splitPoints.push(splitPoint);
        }
      }
    }
    
    return { splitPoints };
  }
}