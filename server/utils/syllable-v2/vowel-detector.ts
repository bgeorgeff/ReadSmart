/**
 * Vowel Sound Detection Module
 * Maps phonemes to letters and identifies vowel clusters
 */

// Standard vowel phonemes from CMU dictionary
export const VOWEL_PHONEMES = new Set([
  'AA', 'AE', 'AH', 'AO', 'AW', 'AY', 'EH', 'ER', 'EY', 
  'IH', 'IY', 'OW', 'OY', 'UH', 'UW'
]);

// Common vowel letter clusters and their typical sound count
export const VOWEL_CLUSTERS = new Map<string, { sounds: number; priority: number }>([
  // Single sound clusters
  ['ai', { sounds: 1, priority: 1 }],  // rain, train
  ['ay', { sounds: 1, priority: 1 }],  // day, play
  ['ea', { sounds: 1, priority: 1 }],  // read, bread
  ['ee', { sounds: 1, priority: 1 }],  // see, tree
  ['oa', { sounds: 1, priority: 1 }],  // boat, coat
  ['oo', { sounds: 1, priority: 1 }],  // book, moon
  ['ou', { sounds: 1, priority: 1 }],  // house, out
  ['oi', { sounds: 1, priority: 1 }],  // oil, coin
  ['oy', { sounds: 1, priority: 1 }],  // boy, toy
  ['au', { sounds: 1, priority: 1 }],  // haul, author
  ['aw', { sounds: 1, priority: 1 }],  // law, saw
  ['ew', { sounds: 1, priority: 1 }],  // new, few
  ['ow', { sounds: 1, priority: 1 }],  // cow, now
  ['ie', { sounds: 1, priority: 1 }],  // pie, tie
  ['ue', { sounds: 1, priority: 1 }],  // blue, true
  ['ui', { sounds: 1, priority: 1 }],  // fruit, suit
  
  // Two sound sequences (hiatus)
  ['ia', { sounds: 2, priority: 2 }],  // di-a-mond, pi-a-no
  ['io', { sounds: 2, priority: 2 }],  // bi-o-logy, vi-o-let
  ['ua', { sounds: 2, priority: 2 }],  // sit-u-a-tion
  ['eo', { sounds: 2, priority: 2 }],  // ge-o-graphy
  ['iu', { sounds: 2, priority: 2 }],  // pre-mi-um
]);

// Silent letter patterns
export const SILENT_PATTERNS = [
  /e$/,           // silent e at end: cake, make
  /ue$/,          // silent e after u: tongue, plague
  /([^aeiou])le$/, // consonant + le: apple, table
];

export interface VowelSound {
  letters: string;
  position: number;
  isSilent: boolean;
  soundCount: number;
}

export class VowelDetector {
  /**
   * Detect all vowel sounds in a word using phoneme data
   */
  detectVowelSounds(word: string, phonemes: string[]): VowelSound[] {
    const vowelSounds: VowelSound[] = [];
    const vowelLetters = 'aeiouAEIOU';
    
    if (phonemes.length > 0) {
      // Use phoneme data for accurate detection
      const vowelPhonemeCount = phonemes.filter(p => 
        VOWEL_PHONEMES.has(p.replace(/[0-2]$/, ''))
      ).length;
      
      // Map phonemes to letter positions
      let letterIndex = 0;
      let phonemeIndex = 0;
      
      while (letterIndex < word.length && phonemeIndex < phonemes.length) {
        const phoneme = phonemes[phonemeIndex].replace(/[0-2]$/, '');
        
        if (VOWEL_PHONEMES.has(phoneme)) {
          // Find the vowel letter(s) for this phoneme
          const start = letterIndex;
          
          // Look for vowel cluster first
          let clusterFound = false;
          for (const [cluster, info] of VOWEL_CLUSTERS) {
            if (word.slice(letterIndex, letterIndex + cluster.length).toLowerCase() === cluster) {
              vowelSounds.push({
                letters: word.slice(letterIndex, letterIndex + cluster.length),
                position: letterIndex,
                isSilent: false,
                soundCount: 1
              });
              letterIndex += cluster.length;
              clusterFound = true;
              break;
            }
          }
          
          // If no cluster, find single vowel
          if (!clusterFound) {
            while (letterIndex < word.length && !vowelLetters.includes(word[letterIndex])) {
              letterIndex++;
            }
            if (letterIndex < word.length) {
              vowelSounds.push({
                letters: word[letterIndex],
                position: letterIndex,
                isSilent: false,
                soundCount: 1
              });
              letterIndex++;
            }
          }
        } else {
          // Skip consonant
          letterIndex++;
        }
        phonemeIndex++;
      }
    } else {
      // Fallback: letter-based detection
      return this.detectVowelSoundsFromLetters(word);
    }
    
    return vowelSounds;
  }

  /**
   * Fallback detection based on letters only
   */
  private detectVowelSoundsFromLetters(word: string): VowelSound[] {
    const vowelSounds: VowelSound[] = [];
    const vowelLetters = 'aeiouAEIOU';
    let i = 0;
    
    while (i < word.length) {
      if (vowelLetters.includes(word[i]) || (word[i].toLowerCase() === 'y' && i > 0)) {
        // Check for vowel clusters
        let clusterLength = 1;
        let soundCount = 1;
        
        // Look ahead for clusters
        for (const [cluster, info] of VOWEL_CLUSTERS) {
          if (word.slice(i, i + cluster.length).toLowerCase() === cluster) {
            clusterLength = cluster.length;
            soundCount = info.sounds;
            break;
          }
        }
        
        // Check if silent
        const isSilent = this.isSilentVowel(word, i, clusterLength);
        
        vowelSounds.push({
          letters: word.slice(i, i + clusterLength),
          position: i,
          isSilent,
          soundCount: isSilent ? 0 : soundCount
        });
        
        i += clusterLength;
      } else {
        i++;
      }
    }
    
    return vowelSounds;
  }

  /**
   * Check if a vowel is silent based on patterns
   */
  private isSilentVowel(word: string, position: number, length: number): boolean {
    // Check silent e at end
    if (position + length === word.length && word[position] === 'e') {
      // Not silent if it's the only vowel
      const otherVowels = word.slice(0, position).match(/[aeiou]/gi);
      return otherVowels && otherVowels.length > 0;
    }
    
    // Check other silent patterns
    const substring = word.slice(position);
    for (const pattern of SILENT_PATTERNS) {
      if (pattern.test(substring)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Count actual vowel sounds (excluding silent ones)
   */
  countVowelSounds(vowelSounds: VowelSound[]): number {
    return vowelSounds.reduce((count, vs) => 
      count + (vs.isSilent ? 0 : vs.soundCount), 0
    );
  }
}