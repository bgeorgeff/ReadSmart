import Hypher from 'hypher';
import enUsPatterns from 'hyphenation.en-us';

// Initialize Hypher with English US patterns
const h = new Hypher(enUsPatterns);

export function breakWordIntoSyllables(word: string): string[] {
  // Clean the word from punctuation
  const cleanWord = word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
  
  // Use Hypher to get dictionary-based syllabification
  const hyphenated = h.hyphenate(cleanWord);
  
  // If no syllables found or single syllable, return as is
  if (!hyphenated || hyphenated.length <= 1) {
    return [cleanWord];
  }
  
  return hyphenated;
}