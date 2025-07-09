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
  // Single sound clusters (keep together - one vowel sound)
  ['ai', { sounds: 1, priority: 1 }],  // rain, train
  ['ay', { sounds: 1, priority: 1 }],  // day, play
  ['au', { sounds: 1, priority: 1 }],  // audience, haul, author, August
  ['aw', { sounds: 1, priority: 1 }],  // law, saw, dawn
  ['ea', { sounds: 1, priority: 1 }],  // read, bread, beach
  ['ee', { sounds: 1, priority: 1 }],  // see, tree, feet
  ['ei', { sounds: 1, priority: 1 }],  // receive, ceiling
  ['ey', { sounds: 1, priority: 1 }],  // key, they
  ['ie', { sounds: 1, priority: 1 }],  // pie, tie, field
  ['oa', { sounds: 1, priority: 1 }],  // boat, coat, road
  ['oe', { sounds: 1, priority: 1 }],  // toe, doe
  ['oo', { sounds: 1, priority: 1 }],  // book, moon, food
  ['ou', { sounds: 1, priority: 1 }],  // house, out, could
  ['ow', { sounds: 1, priority: 1 }],  // cow, now, show
  ['oi', { sounds: 1, priority: 1 }],  // oil, coin, voice
  ['oy', { sounds: 1, priority: 1 }],  // boy, toy, enjoy
  ['ue', { sounds: 1, priority: 1 }],  // blue, true, rescue
  ['ui', { sounds: 1, priority: 1 }],  // fruit, suit, build
  ['ew', { sounds: 1, priority: 1 }],  // new, few, grew
  
  // R-controlled vowels (keep together)
  ['ar', { sounds: 1, priority: 1 }],  // car, farm, star
  ['er', { sounds: 1, priority: 1 }],  // her, fern, verb
  ['ir', { sounds: 1, priority: 1 }],  // bird, first, girl
  ['or', { sounds: 1, priority: 1 }],  // for, corn, sport
  ['ur', { sounds: 1, priority: 1 }],  // fur, turn, nurse
  
  // Three-letter vowel patterns
  ['igh', { sounds: 1, priority: 1 }], // night, light, sight
  ['ough', { sounds: 1, priority: 1 }], // though, through (varies but keep together)
  ['augh', { sounds: 1, priority: 1 }], // laugh, taught
  ['eigh', { sounds: 1, priority: 1 }], // eight, weigh
  
  // Two sound sequences (hiatus - split these)
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
          
          // Look for vowel cluster first (prioritize longer clusters)
          let clusterFound = false;
          const clustersToCheck = Array.from(VOWEL_CLUSTERS.entries())
            .sort((a, b) => b[0].length - a[0].length); // Check longer clusters first
          
          for (const [cluster, info] of clustersToCheck) {
            const wordSlice = word.slice(letterIndex, letterIndex + cluster.length).toLowerCase();
            if (wordSlice === cluster) {
              vowelSounds.push({
                letters: word.slice(letterIndex, letterIndex + cluster.length),
                position: letterIndex,
                isSilent: false,
                soundCount: 1 // Always treat vowel clusters as single sound units for syllabification
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
        // Check for vowel clusters first (prioritize longer clusters)
        let clusterLength = 1;
        let soundCount = 1;
        
        const clustersToCheck = Array.from(VOWEL_CLUSTERS.entries())
          .sort((a, b) => b[0].length - a[0].length); // Check longer clusters first
        
        for (const [cluster, info] of clustersToCheck) {
          const wordSlice = word.slice(i, i + cluster.length).toLowerCase();
          if (wordSlice === cluster) {
            clusterLength = cluster.length;
            soundCount = 1; // Always treat vowel clusters as single sound units for syllabification
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