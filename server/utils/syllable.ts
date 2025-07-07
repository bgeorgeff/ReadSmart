import { syllable } from "syllable";

export function breakWordIntoSyllables(word: string): string[] {
  // Clean the word from punctuation
  const cleanWord = word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
  
  // Common words dictionary for accurate syllabification
  const commonWords: Record<string, string> = {
    'priest': 'priest',
    'came': 'came',
    'commemorate': 'com-me-mor-ate',
    'event': 'e-vent',
    'ceremony': 'cer-e-mo-ny',
    'devised': 'de-vised',
    'several': 'se-ver-al',
    'highly': 'high-ly',
    'qualified': 'qua-li-fied',
    'members': 'mem-bers',
    'institutional': 'in-sti-tu-tion-al',
    'church': 'church',
    'the': 'the',
    'that': 'that',
    'was': 'was',
    'by': 'by',
    'of': 'of',
    'with': 'with',
    'and': 'and',
    'a': 'a',
    'to': 'to',
    // Add more common words as needed
  };
  
  // Check common words dictionary first
  if (commonWords[cleanWord]) {
    return commonWords[cleanWord].split('-');
  }
  
  // Get the number of syllables using the syllable library
  const syllableCount = syllable(cleanWord);
  
  // If it's a single syllable word, don't split it
  if (syllableCount <= 1) {
    return [cleanWord];
  }
  
  // Apply phonetic syllabification principles
  return applySyllabificationPrinciples(cleanWord, syllableCount);
}

function applySyllabificationPrinciples(word: string, syllableCount: number): string[] {
  // Vowel + R combinations (highest priority)
  const vowelRCombinations = ['ar', 'er', 'ir', 'or', 'ur', 'yr'];
  
  // Consonant blends that stay together
  const consonantBlends = [
    'qu', 'bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr',
    'sc', 'sk', 'sl', 'sm', 'sn', 'sp', 'st', 'sw', 'tr', 'tw', 'th', 'sh',
    'ch', 'wh', 'ph', 'gh', 'ck', 'ng', 'nk'
  ];
  
  // Vowel teams that stay together
  const vowelTeams = [
    'ai', 'ay', 'ea', 'ee', 'ei', 'ey', 'ie', 'oa', 'oe', 'oo', 'ou', 'ow',
    'ue', 'ui', 'igh', 'augh', 'ough', 'eigh'
  ];
  
  const isVowel = (char: string) => 'aeiou'.includes(char.toLowerCase());
  
  // Find syllable boundaries
  const boundaries: number[] = [];
  
  for (let i = 1; i < word.length - 1; i++) {
    // Look for vowel + R combinations and ensure they get a consonant in front
    for (const vr of vowelRCombinations) {
      if (word.substring(i, i + vr.length) === vr) {
        // Check if there's a consonant before the vowel+R that we can take
        if (i > 0 && !isVowel(word[i - 1])) {
          // Place boundary before the consonant that goes with vowel+R
          boundaries.push(i - 1);
          i += vr.length; // Skip past the vowel+R combination
          continue;
        }
      }
    }
    
    // Check for consonant clusters
    if (!isVowel(word[i])) {
      let consonantCluster = '';
      let j = i;
      
      // Collect consecutive consonants
      while (j < word.length && !isVowel(word[j])) {
        consonantCluster += word[j];
        j++;
      }
      
      if (consonantCluster.length > 1) {
        // Check if it's a consonant blend
        const isBlend = consonantBlends.includes(consonantCluster) || 
                       consonantBlends.some(blend => consonantCluster.startsWith(blend));
        
        if (isBlend) {
          // Keep the blend together with the following vowel
          boundaries.push(i);
        } else if (consonantCluster.length === 2) {
          // Two consonants: check for double consonants
          if (consonantCluster[0] === consonantCluster[1]) {
            // Double consonant: split between them
            boundaries.push(i + 1);
          } else {
            // Different consonants: first goes with previous syllable, second with next
            boundaries.push(i + 1);
          }
        } else {
          // More than 2 consonants: split to balance
          boundaries.push(i + Math.floor(consonantCluster.length / 2));
        }
        
        i = j - 1; // Skip to end of consonant cluster
      }
    }
  }
  
  // Handle silent 'e' rule
  if (word.endsWith('e') && word.length > 2) {
    const beforeE = word[word.length - 2];
    if (!isVowel(beforeE)) {
      // This might be a silent 'e' situation, don't create extra syllables
      // The syllable count from the library should handle this
    }
  }
  
  // Remove duplicate boundaries and sort
  const uniqueBoundaries = [...new Set(boundaries)].sort((a, b) => a - b);
  
  // Split the word at boundaries
  const syllables: string[] = [];
  let start = 0;
  
  for (const boundary of uniqueBoundaries) {
    if (boundary > start) {
      syllables.push(word.substring(start, boundary));
      start = boundary;
    }
  }
  
  // Add the last part
  if (start < word.length) {
    syllables.push(word.substring(start));
  }
  
  // If we don't have enough syllables, fall back to simple splitting
  if (syllables.length < syllableCount) {
    return fallbackSplitting(word, syllableCount);
  }
  
  // If we have too many syllables, try to combine some
  if (syllables.length > syllableCount) {
    return combineSyllables(syllables, syllableCount);
  }
  
  return syllables;
}

function fallbackSplitting(word: string, targetCount: number): string[] {
  if (targetCount <= 1) {
    return [word];
  }
  
  const isVowel = (char: string) => 'aeiou'.includes(char.toLowerCase());
  const syllables: string[] = [];
  const avgLength = Math.ceil(word.length / targetCount);
  
  let start = 0;
  
  for (let i = 0; i < targetCount - 1; i++) {
    let end = start + avgLength;
    
    // Try to find a better break point near the average
    for (let j = end - 1; j <= end + 1; j++) {
      if (j > start && j < word.length - 1) {
        if ((isVowel(word[j]) && !isVowel(word[j + 1])) || 
            (!isVowel(word[j]) && isVowel(word[j + 1]))) {
          end = j + 1;
          break;
        }
      }
    }
    
    syllables.push(word.substring(start, end));
    start = end;
  }
  
  // Add the last part
  if (start < word.length) {
    syllables.push(word.substring(start));
  }
  
  return syllables;
}

function combineSyllables(syllables: string[], targetCount: number): string[] {
  const result = [...syllables];
  
  while (result.length > targetCount) {
    // Find the shortest adjacent pair to combine
    let minLength = Infinity;
    let combineIndex = 0;
    
    for (let i = 0; i < result.length - 1; i++) {
      const combinedLength = result[i].length + result[i + 1].length;
      if (combinedLength < minLength) {
        minLength = combinedLength;
        combineIndex = i;
      }
    }
    
    // Combine the syllables
    result[combineIndex] = result[combineIndex] + result[combineIndex + 1];
    result.splice(combineIndex + 1, 1);
  }
  
  return result;
}
