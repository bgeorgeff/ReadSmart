export async function breakWordIntoSyllables(word: string): Promise<string[]> {
  // Clean the word from punctuation
  const cleanWord = word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
  
  // Handle empty or very short words
  if (!cleanWord || cleanWord.length <= 2) {
    return [cleanWord];
  }
  
  // Manual override dictionary for words that hypher library doesn't handle accurately
  const manualOverrides: Record<string, string[]> = {
    // Words where hypher misses syllable breaks
    'community': ['com', 'mu', 'ni', 'ty'],           // hypher gives: com-mu-nity (wrong)
    'university': ['u', 'ni', 'ver', 'si', 'ty'],     // hypher gives: uni-ver-sity (wrong)
    'individual': ['in', 'di', 'vid', 'u', 'al'],     // common word that needs accuracy
    'opportunity': ['op', 'por', 'tu', 'ni', 'ty'],   // common word that needs accuracy
    'organization': ['or', 'ga', 'ni', 'za', 'tion'], // common word that needs accuracy
    'responsibility': ['re', 'spon', 'si', 'bil', 'i', 'ty'], // complex word
    'understanding': ['un', 'der', 'stand', 'ing'],   // compound-like word
    'environment': ['en', 'vi', 'ron', 'ment'],       // common word
    'development': ['de', 'vel', 'op', 'ment'],       // common word
    'technology': ['tech', 'nol', 'o', 'gy']          // common word
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