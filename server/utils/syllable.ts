export async function breakWordIntoSyllables(word: string): Promise<string[]> {
  // Clean the word from punctuation
  const cleanWord = word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");

  // Handle empty or very short words
  if (!cleanWord || cleanWord.length <= 2) {
    return [cleanWord];
  }

  // TODO: Replace with CMU Pronouncing Dictionary implementation
  // For now, return the word as a single syllable until CMU integration is complete
  console.warn(`Syllabification temporarily unavailable for word: ${cleanWord}`);
  return [cleanWord];
}



