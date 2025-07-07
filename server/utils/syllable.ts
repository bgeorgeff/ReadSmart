import { syllable } from 'syllable';

export function breakWordIntoSyllables(word: string): string[] {
  // Clean the word from punctuation
  const cleanWord = word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
  
  // Dictionary of known accurate syllable divisions based on Merriam-Webster patterns
  const syllableDict: Record<string, string[]> = {
    // Common words with accurate syllable divisions
    'community': ['com', 'mu', 'ni', 'ty'],
    'university': ['u', 'ni', 'ver', 'si', 'ty'],
    'information': ['in', 'for', 'ma', 'tion'],
    'opportunity': ['op', 'por', 'tu', 'ni', 'ty'],
    'education': ['ed', 'u', 'ca', 'tion'],
    'individual': ['in', 'di', 'vid', 'u', 'al'],
    'individuals': ['in', 'di', 'vid', 'u', 'als'],
    'organization': ['or', 'ga', 'ni', 'za', 'tion'],
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
    'security': ['se', 'cu', 'ri', 'ty'],
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
    'generate': ['gen', 'er', 'ate'],
    'determine': ['de', 'ter', 'mine'],
    'contribute': ['con', 'trib', 'ute'],
    'distribute': ['dis', 'trib', 'ute'],
    'participate': ['par', 'tic', 'i', 'pate'],
    'communicate': ['com', 'mu', 'ni', 'cate'],
    'demonstrate': ['dem', 'on', 'strate'],
    'appreciate': ['ap', 'pre', 'ci', 'ate'],
    'recognize': ['rec', 'og', 'nize'],
    'experience': ['ex', 'pe', 'ri', 'ence'],
    
    // Corrected words from user feedback
    'members': ['mem', 'bers'],
    'member': ['mem', 'ber'],
    'gathered': ['gath', 'ered'],
    'gather': ['gath', 'er'],
    'achievement': ['a', 'chieve', 'ment'],
    'achievements': ['a', 'chieve', 'ments'],
    'achieve': ['a', 'chieve'],
    'priests': ['priests'], // single syllable
    'priest': ['priest'], // single syllable
    'honor': ['hon', 'or'],
    'honored': ['hon', 'ored'],
    'assemble': ['as', 'sem', 'ble'],
    'assembled': ['as', 'sem', 'bled'],
    
    // Additional common words with correct divisions
    'people': ['peo', 'ple'],
    'person': ['per', 'son'],
    'personal': ['per', 'son', 'al'],
    'personality': ['per', 'son', 'al', 'i', 'ty'],
    'company': ['com', 'pa', 'ny'],
    'companies': ['com', 'pa', 'nies'],
    'manager': ['man', 'a', 'ger'],
    'management': ['man', 'age', 'ment'],
    'customer': ['cus', 'tom', 'er'],
    'customers': ['cus', 'tom', 'ers'],
    'service': ['ser', 'vice'],
    'services': ['ser', 'vic', 'es'],
    'product': ['prod', 'uct'],
    'products': ['prod', 'ucts'],
    'production': ['pro', 'duc', 'tion'],
    'develop': ['de', 'vel', 'op'],
    'developed': ['de', 'vel', 'oped'],
    'developing': ['de', 'vel', 'op', 'ing'],
    'developer': ['de', 'vel', 'op', 'er'],
    'application': ['ap', 'pli', 'ca', 'tion'],
    'applications': ['ap', 'pli', 'ca', 'tions'],
    'computer': ['com', 'put', 'er'],
    'computers': ['com', 'put', 'ers'],
    'program': ['pro', 'gram'],
    'programs': ['pro', 'grams'],
    'programming': ['pro', 'gram', 'ming'],
    'programmer': ['pro', 'gram', 'mer'],
    'software': ['soft', 'ware'],
    'hardware': ['hard', 'ware'],
    'database': ['da', 'ta', 'base'],
    'databases': ['da', 'ta', 'bas', 'es'],
    'network': ['net', 'work'],
    'networks': ['net', 'works'],
    'internet': ['in', 'ter', 'net'],
    'website': ['web', 'site'],
    'websites': ['web', 'sites'],
    'document': ['doc', 'u', 'ment'],
    'documents': ['doc', 'u', 'ments'],
    'documentation': ['doc', 'u', 'men', 'ta', 'tion'],
    'present': ['pres', 'ent'],
    'presentation': ['pres', 'en', 'ta', 'tion'],
    'presented': ['pre', 'sent', 'ed'],
    'president': ['pres', 'i', 'dent'],
    'professional': ['pro', 'fes', 'sion', 'al'],
    'professor': ['pro', 'fes', 'sor'],
    'student': ['stu', 'dent'],
    'students': ['stu', 'dents'],
    'teacher': ['teach', 'er'],
    'teachers': ['teach', 'ers'],
    'teaching': ['teach', 'ing'],
    'learning': ['learn', 'ing'],
    'knowledge': ['knowl', 'edge'],
    'understanding': ['un', 'der', 'stand', 'ing'],
    'conference': ['con', 'fer', 'ence'],
    'conferences': ['con', 'fer', 'enc', 'es'],
    'meeting': ['meet', 'ing'],
    'meetings': ['meet', 'ings'],
    'committee': ['com', 'mit', 'tee'],
    'committees': ['com', 'mit', 'tees'],
    'department': ['de', 'part', 'ment'],
    'departments': ['de', 'part', 'ments'],
    'employee': ['em', 'ploy', 'ee'],
    'employees': ['em', 'ploy', 'ees'],
    'employment': ['em', 'ploy', 'ment'],
    'employer': ['em', 'ploy', 'er'],
    'position': ['po', 'si', 'tion'],
    'positions': ['po', 'si', 'tions'],
    'interview': ['in', 'ter', 'view'],
    'interviews': ['in', 'ter', 'views'],
    'candidate': ['can', 'di', 'date'],
    'candidates': ['can', 'di', 'dates'],
    'requirement': ['re', 'quire', 'ment'],
    'requirements': ['re', 'quire', 'ments'],
    'experience': ['ex', 'pe', 'ri', 'ence'],
    'experienced': ['ex', 'pe', 'ri', 'enced'],
    'performance': ['per', 'for', 'mance'],
    'performed': ['per', 'formed'],
    'performer': ['per', 'form', 'er'],
    'complete': ['com', 'plete'],
    'completed': ['com', 'plet', 'ed'],
    'completion': ['com', 'ple', 'tion'],
    'project': ['proj', 'ect'],
    'projects': ['proj', 'ects'],
    'projected': ['pro', 'ject', 'ed'],
    'projection': ['pro', 'jec', 'tion'],
    'protect': ['pro', 'tect'],
    'protected': ['pro', 'tect', 'ed'],
    'protection': ['pro', 'tec', 'tion'],
    'provide': ['pro', 'vide'],
    'provided': ['pro', 'vid', 'ed'],
    'provider': ['pro', 'vid', 'er'],
    'provision': ['pro', 'vi', 'sion'],
    'support': ['sup', 'port'],
    'supported': ['sup', 'port', 'ed'],
    'supporter': ['sup', 'port', 'er'],
    'supporting': ['sup', 'port', 'ing'],
    'report': ['re', 'port'],
    'reported': ['re', 'port', 'ed'],
    'reporter': ['re', 'port', 'er'],
    'reporting': ['re', 'port', 'ing'],
    'record': ['rec', 'ord'],
    'recorded': ['re', 'cord', 'ed'],
    'recorder': ['re', 'cord', 'er'],
    'recording': ['re', 'cord', 'ing'],
    'process': ['proc', 'ess'],
    'processed': ['proc', 'essed'],
    'processes': ['proc', 'ess', 'es'],
    'processing': ['proc', 'ess', 'ing'],
    'processor': ['proc', 'es', 'sor'],
    'produce': ['pro', 'duce'],
    'produced': ['pro', 'duced'],
    'producer': ['pro', 'duc', 'er'],
    'producing': ['pro', 'duc', 'ing'],
    'market': ['mar', 'ket'],
    'markets': ['mar', 'kets'],
    'marketing': ['mar', 'ket', 'ing'],
    'marketer': ['mar', 'ket', 'er'],
    'financial': ['fi', 'nan', 'cial'],
    'finance': ['fi', 'nance'],
    'financed': ['fi', 'nanced'],
    'financing': ['fi', 'nanc', 'ing'],
    'economy': ['e', 'con', 'o', 'my'],
    'economic': ['ec', 'o', 'nom', 'ic'],
    'economics': ['ec', 'o', 'nom', 'ics'],
    'economist': ['e', 'con', 'o', 'mist'],
    'system': ['sys', 'tem'],
    'systems': ['sys', 'tems'],
    'systematic': ['sys', 'tem', 'at', 'ic'],
    'structure': ['struc', 'ture'],
    'structured': ['struc', 'tured'],
    'structures': ['struc', 'tures'],
    'structural': ['struc', 'tur', 'al'],
    'construct': ['con', 'struct'],
    'constructed': ['con', 'struct', 'ed'],
    'construction': ['con', 'struc', 'tion'],
    'constructor': ['con', 'struc', 'tor'],
    'building': ['build', 'ing'],
    'buildings': ['build', 'ings'],
    'design': ['de', 'sign'],
    'designed': ['de', 'signed'],
    'designer': ['de', 'sign', 'er'],
    'designing': ['de', 'sign', 'ing'],
    'create': ['cre', 'ate'],
    'created': ['cre', 'at', 'ed'],
    'creating': ['cre', 'at', 'ing'],
    'creation': ['cre', 'a', 'tion'],
    'creator': ['cre', 'a', 'tor'],
    'image': ['im', 'age'],
    'images': ['im', 'ag', 'es'],
    'imagine': ['i', 'mag', 'ine'],
    'imagined': ['i', 'mag', 'ined'],
    'imagination': ['i', 'mag', 'i', 'na', 'tion'],
    'picture': ['pic', 'ture'],
    'pictures': ['pic', 'tures'],
    'pictured': ['pic', 'tured'],
    'photograph': ['pho', 'to', 'graph'],
    'photographs': ['pho', 'to', 'graphs'],
    'photographer': ['pho', 'tog', 'ra', 'pher'],
    'photography': ['pho', 'tog', 'ra', 'phy'],
    'video': ['vid', 'e', 'o'],
    'videos': ['vid', 'e', 'os'],
    'audio': ['au', 'di', 'o'],
    'visual': ['vis', 'u', 'al'],
    'vision': ['vi', 'sion'],
    'visible': ['vis', 'i', 'ble'],
    'invisible': ['in', 'vis', 'i', 'ble'],
    'display': ['dis', 'play'],
    'displayed': ['dis', 'played'],
    'displaying': ['dis', 'play', 'ing'],
    'screen': ['screen'], // single syllable
    'screens': ['screens'], // single syllable
    'monitor': ['mon', 'i', 'tor'],
    'monitors': ['mon', 'i', 'tors'],
    'monitoring': ['mon', 'i', 'tor', 'ing'],
    'control': ['con', 'trol'],
    'controlled': ['con', 'trolled'],
    'controller': ['con', 'trol', 'ler'],
    'controlling': ['con', 'trol', 'ling'],
    'manage': ['man', 'age'],
    'managed': ['man', 'aged'],
    'managing': ['man', 'ag', 'ing'],
    'organize': ['or', 'ga', 'nize'],
    'organized': ['or', 'ga', 'nized'],
    'organizer': ['or', 'ga', 'niz', 'er'],
    'organizing': ['or', 'ga', 'niz', 'ing'],
    'plan': ['plan'], // single syllable
    'plans': ['plans'], // single syllable
    'planned': ['planned'], // single syllable

  
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