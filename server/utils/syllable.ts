export async function breakWordIntoSyllables(word: string): Promise<string[]> {
  // Clean the word from punctuation
  const cleanWord = word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
  
  // Handle empty or very short words
  if (!cleanWord || cleanWord.length <= 2) {
    return [cleanWord];
  }
  
  // Optional: Keep a small override dictionary for any words that still need manual correction
  const manualOverrides: Record<string, string[]> = {
    // Add any words here that the hypher library doesn't handle correctly
    // Example: 'specialword': ['spe', 'cial', 'word']
  };

  // First check manual overrides
  if (manualOverrides[cleanWord]) {
    return manualOverrides[cleanWord];
  }
  
  try {
    // Use hypher library with Franklin M. Liang's algorithm (89% accuracy)
    const Hypher = (await import('hypher')).default;
    const english = await import('hyphenation.en-us');
    const h = new Hypher(english.default);
    
    // Get syllable array directly
    const syllables = h.hyphenate(cleanWord);
    
    // Return the original word if no syllables found or only one
    if (syllables.length <= 1) {
      return [cleanWord];
    }
    
    return syllables;
  } catch (error) {
    // Fallback to simple splitting if hypher fails
    console.warn(`Hyphenation failed for word: ${cleanWord}`, error);
    return [cleanWord];
  }
}