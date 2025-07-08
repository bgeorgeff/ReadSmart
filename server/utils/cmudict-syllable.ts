
const cmudict = require('cmudict');

export async function breakWordIntoSyllablesCMU(word: string): Promise<string[]> {
  // Clean the word from punctuation
  const cleanWord = word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");

  // Handle empty or very short words
  if (!cleanWord || cleanWord.length <= 2) {
    return [cleanWord];
  }

  try {
    // Get phonetic pronunciation from CMUdict
    const phonemes = cmudict(cleanWord);
    
    if (!phonemes || phonemes.length === 0) {
      console.log(`CMUdict: No pronunciation found for "${cleanWord}"`);
      return [cleanWord];
    }

    // Use the first pronunciation if multiple exist
    const pronunciation = phonemes[0];
    console.log(`CMUdict pronunciation for "${cleanWord}":`, pronunciation);

    // Count syllables by counting stress markers (0, 1, 2)
    const syllableCount = pronunciation.filter((phoneme: string) => /[012]$/.test(phoneme)).length;
    
    console.log(`CMUdict syllable count for "${cleanWord}": ${syllableCount}`);

    // If we have syllable count, try to split the word accordingly
    if (syllableCount > 1) {
      return splitWordBySyllableCount(cleanWord, syllableCount);
    } else {
      return [cleanWord];
    }
  } catch (error) {
    console.warn(`CMUdict failed for word: ${cleanWord}`, error);
    return [cleanWord];
  }
}

// Helper function to split word based on syllable count from CMUdict
function splitWordBySyllableCount(word: string, syllableCount: number): string[] {
  if (syllableCount === 1) {
    return [word];
  }

  // Simple heuristic splitting based on common patterns
  // This is a basic implementation - in production we'd want more sophisticated rules
  
  const vowels = 'aeiou';
  const consonants = 'bcdfghjklmnpqrstvwxyz';
  
  // For 2 syllables, try to find a good break point
  if (syllableCount === 2) {
    // Look for vowel-consonant-vowel patterns
    for (let i = 1; i < word.length - 1; i++) {
      const prev = word[i - 1];
      const curr = word[i];
      const next = word[i + 1];
      
      if (vowels.includes(prev) && consonants.includes(curr) && vowels.includes(next)) {
        return [word.slice(0, i + 1), word.slice(i + 1)];
      }
    }
    
    // Fallback: split roughly in the middle
    const mid = Math.floor(word.length / 2);
    return [word.slice(0, mid), word.slice(mid)];
  }
  
  // For 3+ syllables, use more complex logic
  if (syllableCount >= 3) {
    const syllables: string[] = [];
    const approxLength = Math.floor(word.length / syllableCount);
    
    let start = 0;
    for (let i = 0; i < syllableCount - 1; i++) {
      let end = start + approxLength;
      
      // Adjust end to avoid breaking in the middle of consonant clusters
      while (end < word.length - 1 && consonants.includes(word[end]) && consonants.includes(word[end + 1])) {
        end++;
      }
      
      syllables.push(word.slice(start, end));
      start = end;
    }
    
    // Add the remaining part as the last syllable
    syllables.push(word.slice(start));
    
    return syllables;
  }
  
  return [word];
}

// Test function to compare both methods
export async function compareSyllableMethods(word: string): Promise<{
  original: string[];
  cmudict: string[];
  cmudictSyllableCount?: number;
}> {
  const { breakWordIntoSyllables } = await import('./syllable');
  
  const originalResult = await breakWordIntoSyllables(word);
  const cmudictResult = await breakWordIntoSyllablesCMU(word);
  
  // Get actual syllable count from CMUdict for reference
  const cleanWord = word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
  let cmudictSyllableCount;
  
  try {
    const phonemes = cmudict(cleanWord);
    if (phonemes && phonemes.length > 0) {
      cmudictSyllableCount = phonemes[0].filter((phoneme: string) => /[012]$/.test(phoneme)).length;
    }
  } catch (error) {
    // Ignore errors for comparison
  }
  
  return {
    original: originalResult,
    cmudict: cmudictResult,
    cmudictSyllableCount
  };
}
