import * as syllable from "syllable";

export function breakWordIntoSyllables(word: string): string[] {
  // This is a simplified approach to syllable breakdown
  // For production use, a more sophisticated NLP approach would be better
  
  // Clean the word from punctuation
  const cleanWord = word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
  
  // Get the number of syllables
  const syllableCount = syllable.syllable(cleanWord);
  
  if (syllableCount <= 1) {
    return [cleanWord];
  }
  
  // Some basic patterns for common prefixes and suffixes
  const prefixes = ["pre", "re", "un", "in", "dis", "con", "com", "sub", "super"];
  const suffixes = ["ing", "tion", "sion", "ment", "ness", "ity", "ize", "ise", "able", "ible", "ful", "less"];
  
  let syllables: string[] = [];
  let remaining = cleanWord;
  
  // Check for prefixes
  for (const prefix of prefixes) {
    if (cleanWord.startsWith(prefix) && cleanWord.length > prefix.length + 1) {
      syllables.push(prefix);
      remaining = remaining.substring(prefix.length);
      break;
    }
  }
  
  // Check for suffixes
  for (const suffix of suffixes) {
    if (cleanWord.endsWith(suffix) && cleanWord.length > suffix.length + 1) {
      const lastPart = remaining.substring(remaining.length - suffix.length);
      remaining = remaining.substring(0, remaining.length - suffix.length);
      syllables.push(...splitRemaining(remaining, syllableCount - syllables.length - 1));
      syllables.push(lastPart);
      return syllables;
    }
  }
  
  // If no prefix/suffix was found or processed
  if (syllables.length === 0 || remaining.length > 0) {
    syllables.push(...splitRemaining(remaining, syllableCount - syllables.length));
  }
  
  return syllables;
}

function splitRemaining(text: string, syllableCount: number): string[] {
  if (syllableCount <= 1 || text.length <= 2) {
    return [text];
  }
  
  // Simple heuristic to split the word into roughly equal parts
  const avgSyllableLength = Math.ceil(text.length / syllableCount);
  
  const syllables: string[] = [];
  let start = 0;
  
  for (let i = 0; i < syllableCount - 1; i++) {
    let end = start + avgSyllableLength;
    if (end > text.length - 1) {
      end = text.length;
    }
    
    // Try to find vowel+consonant or consonant+vowel patterns for better splits
    if (end < text.length - 1) {
      const isVowel = (char: string) => 'aeiou'.includes(char.toLowerCase());
      
      // Look ahead and behind a bit to find better split points
      for (let j = end - 1; j <= end + 1; j++) {
        if (j > start && j < text.length - 1) {
          if ((isVowel(text[j]) && !isVowel(text[j+1])) || 
              (!isVowel(text[j]) && isVowel(text[j+1]))) {
            end = j + 1;
            break;
          }
        }
      }
    }
    
    syllables.push(text.substring(start, end));
    start = end;
  }
  
  // Add the last part
  if (start < text.length) {
    syllables.push(text.substring(start));
  }
  
  return syllables;
}
