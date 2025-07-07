import { syllable } from "syllable";

export function breakWordIntoSyllables(word: string): string[] {
  // Clean the word from punctuation
  const cleanWord = word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
  
  // Common words dictionary following phonetic syllabification principles
  const commonWords: Record<string, string> = {
    // Single syllable words (never split)
    'priest': 'priest',
    'came': 'came',
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
    'all': 'all',
    'in': 'in',
    'been': 'been',
    'had': 'had',
    'most': 'most',
    'an': 'an',
    
    // Multi-syllable words following phonetic principles
    'commemorate': 'com-me-mor-ate',  // vowel+R takes consonant in front
    'event': 'e-vent',
    'ceremony': 'cer-e-mo-ny',
    'devised': 'de-vised',
    'several': 'se-ver-al',  // v goes with er to make ver
    'highly': 'high-ly',
    'qualified': 'qua-li-fied',  // qu blend stays together
    'members': 'mem-bers',
    'institutional': 'in-sti-tu-tion-al',
    'individuals': 'in-di-vid-u-als',
    'assemble': 'as-sem-ble',
    'order': 'or-der',
    'solution': 'so-lu-tion',
    'complex': 'com-plex',
    'issue': 'is-sue',
    'proposed': 'pro-posed',
    'priests': 'priests',
    
    // More common words
    'about': 'a-bout',
    'after': 'af-ter',
    'again': 'a-gain',
    'because': 'be-cause',
    'before': 'be-fore',
    'between': 'be-tween',
    'different': 'dif-fer-ent',
    'example': 'ex-am-ple',
    'important': 'im-por-tant',
    'information': 'in-for-ma-tion',
    'number': 'num-ber',
    'people': 'peo-ple',
    'problem': 'prob-lem',
    'program': 'pro-gram',
    'question': 'ques-tion',
    'remember': 'rem-em-ber',
    'something': 'some-thing',
    'together': 'to-geth-er',
    'understand': 'un-der-stand',
    'without': 'with-out'
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
  // Phonetic syllabification principles based on natural speech patterns
  
  // Consonant blends that must stay together
  const consonantBlends = [
    'qu', 'bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr',
    'sc', 'sk', 'sl', 'sm', 'sn', 'sp', 'st', 'sw', 'tr', 'tw', 'th', 'sh',
    'ch', 'wh', 'ph', 'gh', 'ck', 'ng', 'nk', 'tch', 'dge'
  ];
  
  // Vowel teams that stay together
  const vowelTeams = [
    'ai', 'ay', 'ea', 'ee', 'ei', 'ey', 'ie', 'oa', 'oe', 'oo', 'ou', 'ow',
    'ue', 'ui', 'igh', 'augh', 'ough', 'eigh', 'au', 'aw', 'ew', 'oy', 'oi'
  ];
  
  // Common suffixes that form their own syllables
  const suffixes = ['tion', 'sion', 'ture', 'sure', 'ment', 'ness', 'less', 'ful', 'ing', 'ed', 'er', 'est', 'ly', 'ity', 'ble', 'gle', 'dle', 'tle', 'ple'];
  
  const isVowel = (char: string) => 'aeiouy'.includes(char.toLowerCase());
  
  // First, identify key patterns in the word
  let syllables: string[] = [];
  let currentPos = 0;
  let remainingWord = word;
  
  // Step 1: Handle common prefixes
  const prefixes = ['un', 'in', 'im', 'dis', 'mis', 'pre', 're', 'con', 'com', 'de', 'ex', 'sub', 'super', 'inter', 'over', 'under', 'out'];
  for (const prefix of prefixes) {
    if (word.startsWith(prefix) && word.length > prefix.length + 2) {
      // Check if there's a vowel after the prefix
      if (isVowel(word[prefix.length])) {
        syllables.push(prefix);
        currentPos = prefix.length;
        remainingWord = word.substring(currentPos);
        break;
      }
    }
  }
  
  // Step 2: Process the remaining word
  let i = 0;
  let currentSyllable = '';
  
  while (i < remainingWord.length) {
    const char = remainingWord[i];
    
    // Check for vowel teams
    let foundVowelTeam = false;
    for (const team of vowelTeams) {
      if (remainingWord.substring(i, i + team.length) === team) {
        currentSyllable += team;
        i += team.length;
        foundVowelTeam = true;
        break;
      }
    }
    
    if (foundVowelTeam) continue;
    
    // Regular character processing
    currentSyllable += char;
    
    // Look ahead to decide when to break
    if (i < remainingWord.length - 1) {
      const nextChar = remainingWord[i + 1];
      const next2Chars = remainingWord.substring(i + 1, i + 3);
      const next3Chars = remainingWord.substring(i + 1, i + 4);
      
      // Check for syllable break conditions
      let shouldBreak = false;
      
      // Vowel followed by consonant(s) followed by vowel - break before consonant(s)
      if (isVowel(char) && !isVowel(nextChar)) {
        // Look for where the next vowel is
        let consonantCount = 0;
        let j = i + 1;
        while (j < remainingWord.length && !isVowel(remainingWord[j])) {
          consonantCount++;
          j++;
        }
        
        if (j < remainingWord.length) { // There is another vowel
          const consonantCluster = remainingWord.substring(i + 1, j);
          
          // Check if it's a blend that should stay together
          let isBlend = consonantBlends.includes(consonantCluster);
          if (!isBlend) {
            // Check if the cluster starts with a blend
            for (const blend of consonantBlends) {
              if (consonantCluster.startsWith(blend)) {
                isBlend = true;
                break;
              }
            }
          }
          
          // PHONETIC PRINCIPLE: Vowel + R takes the preceding consonant
          if (j < remainingWord.length - 1 && remainingWord[j] === 'r' && 
              isVowel(remainingWord[j - 1]) && j > i + 1) {
            // Don't break, let the consonant go with the vowel+r
            shouldBreak = false;
          } else if (consonantCount === 1) {
            // Single consonant goes with following vowel
            shouldBreak = true;
          } else if (consonantCount === 2 && consonantCluster[0] === consonantCluster[1]) {
            // Double consonants split between
            currentSyllable += nextChar;
            i++;
            shouldBreak = true;
          } else if (isBlend) {
            // Blend stays with following vowel
            shouldBreak = true;
          } else {
            // Multiple different consonants - first stays with current syllable
            currentSyllable += nextChar;
            i++;
            shouldBreak = true;
          }
        }
      }
      
      if (shouldBreak && currentSyllable.length > 0) {
        syllables.push(currentPos > 0 ? currentSyllable : syllables.pop() + currentSyllable);
        currentSyllable = '';
      }
    }
    
    i++;
  }
  
  // Add remaining syllable
  if (currentSyllable.length > 0) {
    if (syllables.length > 0 && currentSyllable.length === 1 && !isVowel(currentSyllable)) {
      // Single consonant at end goes with previous syllable
      syllables[syllables.length - 1] += currentSyllable;
    } else {
      syllables.push(currentSyllable);
    }
  }
  
  // Apply vowel+R principle adjustments
  const adjustedSyllables: string[] = [];
  for (let s = 0; s < syllables.length; s++) {
    let syl = syllables[s];
    
    // Check if next syllable starts with vowel+r
    if (s < syllables.length - 1) {
      const nextSyl = syllables[s + 1];
      if (nextSyl.length >= 2 && isVowel(nextSyl[0]) && nextSyl[1] === 'r') {
        // Check if current syllable ends with consonant that could go with vowel+r
        if (syl.length > 1 && !isVowel(syl[syl.length - 1])) {
          // Move last consonant to next syllable
          adjustedSyllables.push(syl.substring(0, syl.length - 1));
          syllables[s + 1] = syl[syl.length - 1] + nextSyl;
          continue;
        }
      }
    }
    
    adjustedSyllables.push(syl);
  }
  
  return adjustedSyllables.length > 0 ? adjustedSyllables : [word];
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
