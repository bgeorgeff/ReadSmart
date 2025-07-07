import { syllable } from 'syllable';

export function breakWordIntoSyllables(word: string): string[] {
  // Clean the word from punctuation
  const cleanWord = word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
  
  // Dictionary of known accurate syllable divisions
  const syllableDict: Record<string, string[]> = {
    'community': ['com', 'mu', 'ni', 'ty'],
    'university': ['u', 'ni', 'ver', 'si', 'ty'],
    'information': ['in', 'for', 'ma', 'tion'],
    'opportunity': ['op', 'por', 'tu', 'ni', 'ty'],
    'education': ['ed', 'u', 'ca', 'tion'],
    'individual': ['in', 'di', 'vid', 'u', 'al'],
    'individuals': ['in', 'di', 'vid', 'u', 'als'],
    'organization': ['or', 'gan', 'i', 'za', 'tion'],
    'development': ['de', 'vel', 'op', 'ment'],
    'environment': ['en', 'vi', 'ron', 'ment'],
    'government': ['gov', 'ern', 'ment'],
    'technology': ['tech', 'nol', 'o', 'gy'],
    'beautiful': ['beau', 'ti', 'ful'],
    'important': ['im', 'por', 'tant'],
    'different': ['dif', 'fer', 'ent'],
    'remember': ['re', 'mem', 'ber'],
    'together': ['to', 'geth', 'er'],
    'understand': ['un', 'der', 'stand'],
    'something': ['some', 'thing'],
    'everything': ['ev', 'ery', 'thing'],
    'everyone': ['ev', 'ery', 'one'],
    'question': ['ques', 'tion'],
    'problem': ['prob', 'lem'],
    'example': ['ex', 'am', 'ple'],
    'between': ['be', 'tween'],
    'because': ['be', 'cause'],
    'without': ['with', 'out'],
    'another': ['an', 'oth', 'er'],
    'children': ['chil', 'dren'],
    'business': ['bus', 'i', 'ness'],
    'interest': ['in', 'ter', 'est'],
    'general': ['gen', 'er', 'al'],
    'history': ['his', 'to', 'ry'],
    'possible': ['pos', 'si', 'ble'],
    'quality': ['qual', 'i', 'ty'],
    'national': ['na', 'tion', 'al'],
    'activity': ['ac', 'tiv', 'i', 'ty'],
    'ability': ['a', 'bil', 'i', 'ty'],
    'reality': ['re', 'al', 'i', 'ty'],
    'security': ['se', 'cur', 'i', 'ty'],
    'political': ['po', 'lit', 'i', 'cal'],
    'material': ['ma', 'te', 'ri', 'al'],
    'original': ['o', 'rig', 'i', 'nal'],
    'creative': ['cre', 'a', 'tive'],
    'necessary': ['nec', 'es', 'sar', 'y'],
    'identify': ['i', 'den', 'ti', 'fy'],
    'category': ['cat', 'e', 'go', 'ry'],
    'continue': ['con', 'tin', 'ue'],
    'consider': ['con', 'sid', 'er'],
    'separate': ['sep', 'a', 'rate'],
    'advantage': ['ad', 'van', 'tage'],
    'celebrate': ['cel', 'e', 'brate'],
    'celebrate': ['cel', 'e', 'brate'],
    'generate': ['gen', 'er', 'ate'],
    'determine': ['de', 'ter', 'mine'],
    'contribute': ['con', 'trib', 'ute'],
    'distribute': ['dis', 'trib', 'ute'],
    'participate': ['par', 'tic', 'i', 'pate'],
    'communicate': ['com', 'mu', 'ni', 'cate'],
    'demonstrate': ['dem', 'on', 'strate'],
    'appreciate': ['ap', 'pre', 'ci', 'ate'],
    'recognize': ['rec', 'og', 'nize'],
    'experience': ['ex', 'pe', 'ri', 'ence']
  };
  
  // Check dictionary first
  if (syllableDict[cleanWord]) {
    return syllableDict[cleanWord];
  }
  
  // Get syllable count
  const syllableCount = syllable(cleanWord);
  
  // If single syllable, return as is
  if (syllableCount <= 1) {
    return [cleanWord];
  }
  
  // Use improved algorithm for division
  return divideBySyllableRules(cleanWord, syllableCount);
}

function divideBySyllableRules(word: string, targetSyllables: number): string[] {
  const isVowel = (char: string) => 'aeiouy'.includes(char.toLowerCase());
  
  // Common vowel teams that stay together
  const vowelTeams = ['ai', 'ay', 'ea', 'ee', 'ei', 'ey', 'ie', 'oa', 'oe', 'oo', 'ou', 'ow', 'ue', 'ui', 'igh', 'au', 'aw', 'ew', 'oy', 'oi'];
  
  // Find vowel centers (nucleus of each syllable)
  const vowelCenters: number[] = [];
  let i = 0;
  
  while (i < word.length) {
    // Check for vowel teams first
    let foundTeam = false;
    for (const team of vowelTeams) {
      if (word.substring(i, i + team.length) === team) {
        vowelCenters.push(i);
        i += team.length;
        foundTeam = true;
        break;
      }
    }
    
    if (!foundTeam) {
      if (isVowel(word[i])) {
        vowelCenters.push(i);
      }
      i++;
    }
  }
  
  // If we don't have enough vowel centers, use fallback
  if (vowelCenters.length < targetSyllables) {
    return fallbackSplit(word, targetSyllables);
  }
  
  // Create syllable boundaries
  const boundaries: number[] = [0]; // Start of word
  
  for (let v = 0; v < vowelCenters.length - 1; v++) {
    const currentVowel = vowelCenters[v];
    const nextVowel = vowelCenters[v + 1];
    
    // Find consonants between vowels
    let consonantStart = currentVowel + 1;
    while (consonantStart < nextVowel && isVowel(word[consonantStart])) {
      consonantStart++;
    }
    
    let consonantEnd = nextVowel;
    while (consonantEnd > consonantStart && isVowel(word[consonantEnd])) {
      consonantEnd--;
    }
    
    const consonantCount = consonantEnd - consonantStart;
    
    if (consonantCount === 0) {
      // No consonants between vowels - split between vowels
      boundaries.push(nextVowel);
    } else if (consonantCount === 1) {
      // Single consonant goes with following vowel
      boundaries.push(consonantStart);
    } else {
      // Multiple consonants - split between them
      const splitPoint = consonantStart + Math.floor(consonantCount / 2);
      boundaries.push(splitPoint);
    }
  }
  
  boundaries.push(word.length); // End of word
  
  // Create syllables from boundaries
  const syllables: string[] = [];
  for (let b = 0; b < boundaries.length - 1; b++) {
    const syllable = word.substring(boundaries[b], boundaries[b + 1]);
    if (syllable.length > 0) {
      syllables.push(syllable);
    }
  }
  
  // Adjust if we have too many or too few syllables
  if (syllables.length > targetSyllables) {
    return combineSyllables(syllables, targetSyllables);
  } else if (syllables.length < targetSyllables) {
    return splitMoreSyllables(syllables, targetSyllables);
  }
  
  return syllables;
}

function fallbackSplit(word: string, targetSyllables: number): string[] {
  if (targetSyllables <= 1) return [word];
  
  const syllables: string[] = [];
  const avgLength = Math.ceil(word.length / targetSyllables);
  
  let start = 0;
  for (let i = 0; i < targetSyllables - 1; i++) {
    let end = Math.min(start + avgLength, word.length - (targetSyllables - i - 1));
    syllables.push(word.substring(start, end));
    start = end;
  }
  
  if (start < word.length) {
    syllables.push(word.substring(start));
  }
  
  return syllables;
}

function combineSyllables(syllables: string[], target: number): string[] {
  const result = [...syllables];
  
  while (result.length > target) {
    // Find shortest adjacent pair to combine
    let shortestIndex = 0;
    let shortestLength = result[0].length + result[1].length;
    
    for (let i = 1; i < result.length - 1; i++) {
      const combinedLength = result[i].length + result[i + 1].length;
      if (combinedLength < shortestLength) {
        shortestLength = combinedLength;
        shortestIndex = i;
      }
    }
    
    result[shortestIndex] = result[shortestIndex] + result[shortestIndex + 1];
    result.splice(shortestIndex + 1, 1);
  }
  
  return result;
}

function splitMoreSyllables(syllables: string[], target: number): string[] {
  // This is complex to implement properly, so use fallback
  const word = syllables.join('');
  return fallbackSplit(word, target);
}