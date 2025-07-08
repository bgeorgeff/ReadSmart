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
    'technology': ['tech', 'nol', 'o', 'gy'],         // common word
    'adaptability': ['a', 'dap', 'ta', 'bil', 'i', 'ty'], // hypher gives: adapt-abil-i-ty (wrong)
    'mathematicians': ['math', 'e', 'ma', 'ti', 'cians'],   // hypher gives: math-e-mati-cians (wrong)
    'participants': ['par', 'ti', 'ci', 'pants'],          // hypher gives: par-tic-i-pants (wrong)
    'collaborated': ['co', 'lab', 'o', 'ra', 'ted'],       // hypher gives: col-lab-o-rated (wrong)
    'awareness': ['a', 'ware', 'ness'],                    // hypher gives: aware-ness (wrong)
    'strategies': ['stra', 'te', 'gies'],                  // hypher gives: strate-gies (wrong)
    'bureaucratic': ['bur', 'eau', 'cra', 'tic'],          // hypher gives: bu-reau-cratic (wrong)
    'initiative': ['i', 'ni', 'tia', 'tive']                   // hypher gives: ini-tia-tive (wrong)
    // Note: phonological and related ph- words now handled by pattern rules
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
    let syllables = h.hyphenate(cleanWord);
    
    // Return the original word if no syllables found or only one
    if (syllables.length <= 1) {
      return [cleanWord];
    }
    
    // Apply pattern-based post-processing rules to fix systematic errors
    syllables = applyPatternFixes(syllables);
    
    return syllables;
  } catch (error) {
    // Fallback to simple splitting if hypher fails
    console.warn(`Hyphenation failed for word: ${cleanWord}`, error);
    return [cleanWord];
  }
}

// Apply systematic pattern fixes for common hyphenation errors
function applyPatternFixes(syllables: string[]): string[] {
  if (syllables.length === 0) return syllables;
  
  let fixed = [...syllables];
  
  // Pattern 1: Break off "ly" suffix as separate syllable
  const lastSyllable = fixed[fixed.length - 1];
  if (lastSyllable.endsWith('ly') && lastSyllable.length > 2) {
    const base = lastSyllable.slice(0, -2);
    if (base.length > 0) {
      fixed[fixed.length - 1] = base;
      fixed.push('ly');
    }
  }
  
  // Pattern 2: Break "tional" into "tion-al" 
  for (let i = 0; i < fixed.length; i++) {
    if (fixed[i].includes('tional')) {
      const parts = fixed[i].split('tional');
      if (parts.length === 2) {
        const newSyllables = [];
        if (parts[0]) newSyllables.push(parts[0]);
        newSyllables.push('tion', 'al');
        if (parts[1]) newSyllables.push(parts[1]);
        fixed.splice(i, 1, ...newSyllables);
        break;
      }
    }
  }
  
  // Pattern 3: Break "unan" prefix into "u-na-ni"
  if (fixed.length > 0 && fixed[0] === 'unan') {
    // Check if next syllable is just "i" (common in "unanimously")
    if (fixed.length > 1 && fixed[1] === 'i') {
      // Replace "unan", "i" with "u", "na", "ni"
      fixed.splice(0, 2, 'u', 'na', 'ni');
    } else {
      // Replace "unan" with "u", "na", "ni"
      fixed[0] = 'u';
      fixed.splice(1, 0, 'na', 'ni');
    }
  }
  
  // Pattern 4: Break "ary" suffix into "ar-y"
  let lastIdx = fixed.length - 1;
  if (fixed[lastIdx] === 'ary') {
    // Replace "ary" with "ar", "y"
    fixed[lastIdx] = 'ar';
    fixed.push('y');
  } else if (fixed[lastIdx].endsWith('ary') && fixed[lastIdx].length > 3) {
    const base = fixed[lastIdx].slice(0, -3);
    if (base.length > 0) {
      fixed[lastIdx] = base + 'ar';
      fixed.push('y');
    }
  }
  
  // Pattern 5: Break "ity" suffix into "i-ty" 
  // Update lastIdx in case it changed from previous patterns
  lastIdx = fixed.length - 1;
  if (fixed[lastIdx] === 'ity') {
    // Replace "ity" with "i", "ty"
    fixed[lastIdx] = 'i';
    fixed.push('ty');
  } else if (fixed[lastIdx].endsWith('ity') && fixed[lastIdx].length > 3) {
    const base = fixed[lastIdx].slice(0, -3);
    if (base.length > 0) {
      fixed[lastIdx] = base + 'i';
      fixed.push('ty');
    }
  }
  
  // Pattern 6: Break "ally" suffix into "al-ly"
  if (fixed[lastIdx].endsWith('ally') && fixed[lastIdx].length > 4) {
    const base = fixed[lastIdx].slice(0, -4);
    if (base.length > 0) {
      fixed[lastIdx] = base + 'al';
      fixed.push('ly');
    }
  }
  
  // Pattern 7: Break "mati" into "ma-ti" (as in "mathematicians")
  for (let i = 0; i < fixed.length; i++) {
    if (fixed[i] === 'mati') {
      fixed.splice(i, 1, 'ma', 'ti');
      break;
    }
  }
  
  // Pattern 8: Break "mat" + "i" into "ma" + "ti" (when "mat" is followed by "i")
  for (let i = 0; i < fixed.length - 1; i++) {
    if (fixed[i] === 'mat' && fixed[i + 1] === 'i') {
      fixed.splice(i, 2, 'ma', 'ti');
      break;
    }
  }
  
  // Pattern 9: Break "at" + "i" into "a" + "ti" (when "at" is followed by "i", like in "systematically")
  for (let i = 0; i < fixed.length - 1; i++) {
    if (fixed[i] === 'at' && fixed[i + 1] === 'i') {
      fixed.splice(i, 2, 'a', 'ti');
      break;
    }
  }
  
  // Pattern 10: Break "c" + "i" into "ci" (when c makes /s/ sound)
  for (let i = 0; i < fixed.length - 1; i++) {
    if (fixed[i].endsWith('c') && fixed[i + 1].startsWith('i')) {
      const base = fixed[i].slice(0, -1);
      const rest = fixed[i + 1].slice(1);
      if (base.length > 0) {
        fixed.splice(i, 2, base, 'ci' + rest);
        break;
      }
    }
  }
  
  // Pattern 11: Break "g" + "i" into "gi" (when g makes /j/ sound)  
  for (let i = 0; i < fixed.length - 1; i++) {
    if (fixed[i].endsWith('g') && fixed[i + 1].startsWith('i')) {
      const base = fixed[i].slice(0, -1);
      const rest = fixed[i + 1].slice(1);
      if (base.length > 0) {
        fixed.splice(i, 2, base, 'gi' + rest);
        break;
      }
    }
  }
  
  // Pattern 12: Break "nious" into "ni-ous"
  for (let i = 0; i < fixed.length; i++) {
    if (fixed[i].includes('nious')) {
      const parts = fixed[i].split('nious');
      if (parts.length === 2) {
        const newSyllables = [];
        if (parts[0]) newSyllables.push(parts[0]);
        newSyllables.push('ni', 'ous');
        if (parts[1]) newSyllables.push(parts[1]);
        fixed.splice(i, 1, ...newSyllables);
        break;
      }
    }
  }
  
  // Pattern 13: Break "agree" into "a-gree"
  for (let i = 0; i < fixed.length; i++) {
    if (fixed[i].includes('agree')) {
      const parts = fixed[i].split('agree');
      if (parts.length === 2) {
        const newSyllables = [];
        if (parts[0]) newSyllables.push(parts[0]);
        newSyllables.push('a', 'gree');
        if (parts[1]) newSyllables.push(parts[1]);
        fixed.splice(i, 1, ...newSyllables);
        break;
      }
    }
  }
  
  // Pattern 14: Break "phono" into "pho-no" (phonograph, phonological, etc.)
  for (let i = 0; i < fixed.length; i++) {
    if (fixed[i].includes('phono')) {
      const parts = fixed[i].split('phono');
      if (parts.length === 2) {
        const newSyllables = [];
        if (parts[0]) newSyllables.push(parts[0]);
        newSyllables.push('pho', 'no');
        if (parts[1]) newSyllables.push(parts[1]);
        fixed.splice(i, 1, ...newSyllables);
        break;
      }
    }
  }
  
  // Pattern 15: Break "photo" into "pho-to" (photograph, photography, etc.)
  for (let i = 0; i < fixed.length; i++) {
    if (fixed[i].includes('photo')) {
      const parts = fixed[i].split('photo');
      if (parts.length === 2) {
        const newSyllables = [];
        if (parts[0]) newSyllables.push(parts[0]);
        newSyllables.push('pho', 'to');
        if (parts[1]) newSyllables.push(parts[1]);
        fixed.splice(i, 1, ...newSyllables);
        break;
      }
    }
  }
  
  // Pattern 16: Break "phospho" into "phos-pho" (phosphorus, phosphate, etc.)
  for (let i = 0; i < fixed.length; i++) {
    if (fixed[i].includes('phospho')) {
      const parts = fixed[i].split('phospho');
      if (parts.length === 2) {
        const newSyllables = [];
        if (parts[0]) newSyllables.push(parts[0]);
        newSyllables.push('phos', 'pho');
        if (parts[1]) newSyllables.push(parts[1]);
        fixed.splice(i, 1, ...newSyllables);
        break;
      }
    }
  }
  
  // Pattern 17: Break "philos" into "phi-los" (philosophy, philosopher, etc.)
  for (let i = 0; i < fixed.length; i++) {
    if (fixed[i].includes('philos')) {
      const parts = fixed[i].split('philos');
      if (parts.length === 2) {
        const newSyllables = [];
        if (parts[0]) newSyllables.push(parts[0]);
        newSyllables.push('phi', 'los');
        if (parts[1]) newSyllables.push(parts[1]);
        fixed.splice(i, 1, ...newSyllables);
        break;
      }
    }
  }
  
  // Pattern 18: Break "astro" into "a-stro" (astronomy, astronomer, etc.)
  for (let i = 0; i < fixed.length; i++) {
    if (fixed[i].includes('astro')) {
      const parts = fixed[i].split('astro');
      if (parts.length === 2) {
        const newSyllables = [];
        if (parts[0]) newSyllables.push(parts[0]);
        newSyllables.push('a', 'stro');
        if (parts[1]) newSyllables.push(parts[1]);
        fixed.splice(i, 1, ...newSyllables);
        break;
      }
    }
  }

  
  return fixed;
}