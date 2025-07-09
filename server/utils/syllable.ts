// CMU Dictionary phoneme to syllable converter
class CMUSyllabifier {
  private dictionary: Map<string, string[]> = new Map();
  private initialized = false;

  // ARPAbet vowel phonemes that indicate syllable cores
  private readonly VOWEL_PHONEMES = new Set([
    'AA', 'AE', 'AH', 'AO', 'AW', 'AY', 'EH', 'ER', 'EY', 'IH', 'IY', 'OW', 'OY', 'UH', 'UW'
  ]);

  // Morphological overrides - root words + suffixes for educational clarity
  private readonly MORPHOLOGICAL_OVERRIDES = new Map([
    ['testing', ['test', 'ing']],
    ['running', ['run', 'ning']],
    ['walking', ['walk', 'ing']],
    ['talking', ['talk', 'ing']],
    ['reading', ['read', 'ing']],
    ['writing', ['writ', 'ing']],
    ['looking', ['look', 'ing']],
    ['playing', ['play', 'ing']],
    ['working', ['work', 'ing']],
    ['jumping', ['jump', 'ing']],
    ['swimming', ['swim', 'ming']],
    ['singing', ['sing', 'ing']],
    ['dancing', ['danc', 'ing']],
    ['helping', ['help', 'ing']],
    ['cleaning', ['clean', 'ing']],
    ['teaching', ['teach', 'ing']],
    ['learning', ['learn', 'ing']],
    ['thinking', ['think', 'ing']],
    ['feeling', ['feel', 'ing']],
    ['knowing', ['know', 'ing']],
  ]);

  // Consonant clusters that can begin English words
  private readonly WORD_INITIAL_CLUSTERS = new Set([
    'bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr', 'sc', 'sk', 'sl', 'sm', 'sn', 
    'sp', 'st', 'sw', 'th', 'tr', 'tw', 'ch', 'sh', 'wh', 'qu', 'scr', 'spr', 'str', 'spl', 'squ'
  ]);

  // Consonant combinations that should stay together (even if they can't start words)
  private readonly CONSONANT_CLUSTERS_TO_PRESERVE = new Set([
    'ng', 'nk', 'nd', 'nt', 'mp', 'mb', 'ld', 'rd', 'st', 'sk', 'sp'
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
    // Check for morphological overrides first (morphological structure trumps other rules)
    const morphOverride = this.MORPHOLOGICAL_OVERRIDES.get(word.toLowerCase());
    if (morphOverride) {
      return morphOverride;
    }
    
    // Count syllables by counting vowel phonemes (each vowel = one syllable)
    const vowelCount = phonemes.filter(p => this.VOWEL_PHONEMES.has(p.replace(/[0-2]$/, ''))).length;
    
    if (vowelCount === 0) {
      return [word];
    }
    
    if (vowelCount === 1) {
      return [word];
    }
    
    // Use consonant cluster rules for multi-syllable words, pass phonemes for sound checking
    return this.splitWordWithConsonantClusterRules(word, vowelCount, phonemes);
  }

  private splitWordWithConsonantClusterRules(word: string, syllableCount: number, phonemes: string[] = []): string[] {
    if (syllableCount <= 1) {
      return [word];
    }
    
    const vowels = 'aeiouAEIOU';
    
    // Special case: check for c+i/e/y pattern at the beginning of the word
    // Only apply to specific words where it's clearly beneficial
    if (word.length >= 2 && word[0].toLowerCase() === 'c' && 'iey'.includes(word[1].toLowerCase())) {
      // Only apply to words like "cycle", "city", "cymbal" - NOT "center"
      const cVowelWords = ['city', 'cycle', 'cycling', 'cymbal', 'cypress'];
      if (cVowelWords.includes(word.toLowerCase())) {
        const restOfWord = word.slice(2);
        if (restOfWord.length > 0) {
          // Process rest of word separately 
          const vowelCount = restOfWord.split('').filter(c => vowels.includes(c)).length;
          if (vowelCount > 0) {
            const restSyllables = this.splitWordWithConsonantClusterRules(restOfWord, vowelCount);
            return [word.slice(0, 2), ...restSyllables];
          } else {
            return [word.slice(0, 2), restOfWord];
          }
        } else {
          return [word];
        }
      }
    }

    // Special case: check for g+i/e/y pattern at the beginning of the word if g makes /j/ sound
    if (word.length >= 2 && word[0].toLowerCase() === 'g' && 'iey'.includes(word[1].toLowerCase())) {
      // Check if g makes /j/ sound using phoneme data
      if (this.doesGMakeJSound(word, 0, phonemes)) {
        // Only apply to specific words where it's clearly beneficial
        const gVowelWords = ['giant', 'gentle', 'gym', 'giraffe', 'genius', 'ginger', 'gypsy'];
        if (gVowelWords.includes(word.toLowerCase())) {
          const restOfWord = word.slice(2);
          if (restOfWord.length > 0) {
            // Process rest of word separately 
            const vowelCount = restOfWord.split('').filter(c => vowels.includes(c)).length;
            if (vowelCount > 0) {
              const restSyllables = this.splitWordWithConsonantClusterRules(restOfWord, vowelCount);
              return [word.slice(0, 2), ...restSyllables];
            } else {
              return [word.slice(0, 2), restOfWord];
            }
          } else {
            return [word];
          }
        }
      }
    }
    
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
    
    // Apply consonant cluster rules
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
      
      // Get the consonant cluster
      const consonantCluster = word.slice(consonantStart, consonantEnd + 1);
      let splitPoint: number;
      
      if (consonantCluster.length === 0) {
        // No consonants between vowels - split at vowel boundary
        splitPoint = nextVowelPos;
      } else if (consonantCluster.length === 1) {
        // Single consonant: check for special phonetic rules first
        splitPoint = this.applySingleConsonantRules(word, consonantStart, nextVowelPos, phonemes);
      } else {
        // Multiple consonants: apply cluster rules
        splitPoint = this.applyCVRules(consonantCluster, consonantStart);
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
  
  private applySingleConsonantRules(word: string, consonantStart: number, nextVowelPos: number, phonemes: string[] = []): number {
    const consonant = word[consonantStart];
    const nextVowel = word[nextVowelPos];
    
    // Special rule: "c" + "i/e/y" stays together only at word boundaries or after vowels
    // This prevents breaking up words like "center" which should be "cen-ter" not "ce-nter"
    if (consonant.toLowerCase() === 'c' && 'iey'.includes(nextVowel.toLowerCase())) {
      // Only apply if c is at beginning of word or after a vowel
      if (consonantStart === 0 || 'aeiouAEIOU'.includes(word[consonantStart - 1])) {
        // Move consonant to the left with the vowel (split after the vowel)
        return nextVowelPos + 1;
      }
    }
    
    // Special rule: "g" + "i/e/y" stays together only if g makes /j/ sound
    if (consonant.toLowerCase() === 'g' && 'iey'.includes(nextVowel.toLowerCase())) {
      if (this.doesGMakeJSound(word, consonantStart, phonemes)) {
        // Only apply if g is at beginning of word or after a vowel
        if (consonantStart === 0 || 'aeiouAEIOU'.includes(word[consonantStart - 1])) {
          // Move consonant to the left with the vowel (split after the vowel)
          return nextVowelPos + 1;
        }
      }
    }
    
    // Default: split before consonant to create open syllable
    return consonantStart;
  }

  private doesGMakeJSound(word: string, gPosition: number, phonemes: string[]): boolean {
    // If no phonemes provided, can't determine sound
    if (phonemes.length === 0) {
      return false;
    }
    
    // Look for JH phoneme (which represents /j/ sound) in the phonemes
    // The position mapping is approximate since phonemes don't directly map to letter positions
    const hasJHPhoneme = phonemes.some(p => p.replace(/[0-2]$/, '') === 'JH');
    
    // If word contains JH phoneme and has g+i/e/y pattern, likely the g makes /j/ sound
    if (hasJHPhoneme && gPosition < word.length - 1) {
      const nextChar = word[gPosition + 1].toLowerCase();
      return 'iey'.includes(nextChar);
    }
    
    return false;
  }

  private applyCVRules(consonantCluster: string, consonantStart: number): number {
    // Check for special phonetic rules first (c + i/e/y pattern)
    if (consonantCluster.length >= 2 && consonantCluster[0].toLowerCase() === 'c') {
      // Look ahead to see if there's a vowel after this cluster that would trigger c+i/e/y rule
      // This is handled elsewhere, so continue with normal cluster rules
    }
    
    // PRIORITY 1: Check for consonant combinations that should be preserved (like ng, nk, etc.)
    // This must come BEFORE word-initial cluster rules
    if (consonantCluster.length >= 2) {
      for (let i = 0; i < consonantCluster.length - 1; i++) {
        const combo = consonantCluster.slice(i, i + 2).toLowerCase();
        if (this.CONSONANT_CLUSTERS_TO_PRESERVE.has(combo)) {
          // Keep this combination together - split before it
          return consonantStart + i;
        }
      }
    }
    
    // PRIORITY 2: Check if cluster can begin a word (only if no preserve rules applied)
    if (this.WORD_INITIAL_CLUSTERS.has(consonantCluster.toLowerCase())) {
      // Keep entire cluster together - split before it to create open syllable
      return consonantStart;
    }
    
    // PRIORITY 3: Check if suffix of cluster can begin a word or should be preserved
    for (let i = 1; i < consonantCluster.length; i++) {
      const suffix = consonantCluster.slice(i).toLowerCase();
      
      // First check if any part of this suffix should be preserved
      if (suffix.length >= 2) {
        for (let j = 0; j < suffix.length - 1; j++) {
          const combo = suffix.slice(j, j + 2).toLowerCase();
          if (this.CONSONANT_CLUSTERS_TO_PRESERVE.has(combo)) {
            // Split before the preserved combination
            return consonantStart + i + j;
          }
        }
      }
      
      // Then check if suffix can start a word
      if (this.WORD_INITIAL_CLUSTERS.has(suffix)) {
        // Split before the valid cluster to create open syllable
        return consonantStart + i;
      }
    }
    
    // No valid cluster found - prefer open syllables
    // For single consonant: split before it (creates open syllable)
    // For multiple consonants: split after first consonant (creates open syllable)
    if (consonantCluster.length === 1) {
      return consonantStart; // Split before single consonant
    } else {
      return consonantStart + 1; // Split after first consonant to create open syllable
    }
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



