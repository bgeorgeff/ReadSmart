/**
 * Morphological Analysis Module
 * Detects prefixes, suffixes, and root words
 */

export interface Morpheme {
  text: string;
  type: 'prefix' | 'suffix' | 'root';
  position: number;
  syllables: string[];
}

// 1-syllable suffixes that should NOT be divided
export const UNDIVIDABLE_SUFFIXES = new Map<string, string[]>([
  // -ence family (1 syllable)
  ['ence', ['ence']],      // sci-ence
  ['tience', ['tience']],  // pa-tience (ti makes /ʃ/ sound)
  ['cience', ['cience']],  // con-science

  // -tia/-tion family (1 syllable)
  ['tia', ['tia']],        // de-men-tia
  ['tion', ['tion']],      // na-tion
  ['tian', ['tian']],      // Egyp-tian
  ['tious', ['tious']],    // cau-tious
  ['tial', ['tial']],      // par-tial
  ['tient', ['tient']],    // pa-tient

  // -cia/-cial family (1 syllable)
  ['cia', ['cia']],        // Mar-cia
  ['cion', ['cion']],      // su-spi-cion
  ['cian', ['cian']],      // mu-si-cian
  ['cious', ['cious']],    // pre-cious
  ['cial', ['cial']],      // spe-cial
  ['cient', ['cient']],    // suf-fi-cient

  // -sia/-sion family (1 syllable)
  ['sia', ['sia']],        // A-sia
  ['sion', ['sion']],      // ten-sion
  ['sian', ['sian']],      // Rus-sian
  ['sious', ['sious']],    // am-bi-tious

  // -gia/-gion family (1 syllable)
  ['gia', ['gia']],        // Geor-gia
  ['gion', ['gion']],      // re-gion
  ['gian', ['gian']],      // Bel-gian
  ['gious', ['gious']],    // re-li-gious

  // Other 1-syllable suffixes
  ['ous', ['ous']],        // fa-mous

  // Standard 1-syllable suffixes
  ['ing', ['ing']],        // walk-ing
  ['ed', ['ed']],          // walk-ed (but see special rules)
  ['er', ['er']],          // walk-er
  ['est', ['est']],        // tall-est
  ['ly', ['ly']],          // quick-ly
  ['ness', ['ness']],      // kind-ness
  ['ment', ['ment']],      // pay-ment
  ['ful', ['ful']],        // care-ful
  ['less', ['less']],      // care-less
]);

// 2-syllable suffixes that need to be split
export const DIVISIBLE_SUFFIXES = new Map<string, string[]>([
  // 2-syllable suffixes from your analysis
  ['ience', ['i', 'ence']], // exper-i-ence
  ['ia', ['i', 'a']],       // me-di-a
  ['ion', ['i', 'on']],     // cham-pi-on
  ['ian', ['i', 'an']],     // Canad-i-an
  ['ious', ['i', 'ous']],   // glor-i-ous
  ['ial', ['i', 'al']],     // rad-i-al
  ['ient', ['i', 'ent']],   // obed-i-ent
  ['uous', ['u', 'ous']],   // contin-u-ous

  // Multi-syllable suffixes
  ['able', ['a', 'ble']],   // read-a-ble
  ['ible', ['i', 'ble']],   // vis-i-ble
  ['tional', ['tion', 'al']], // na-tion-al
  ['ingly', ['sing', 'ly']], // surpri-sing-ly (consonant moves to create open syllable)

  // Special case: eous can be 1 or 2 syllables
  ['eous', ['e', 'ous']],   // err-o-ne-ous (default to 2, override specific words)
]);

// False flag silent-e words - final "e" is pronounced, not silent
export const FALSE_FLAG_SILENT_E_OVERRIDES = new Map<string, string[]>([
  // French-origin words (15 words) - using English spellings without diacritical marks
  ['cliche', ['cli', 'che']],
  ['fiance', ['fi', 'an', 'ce']],
  ['fiancee', ['fi', 'an', 'cee']],
  ['resume', ['re', 'su', 'me']],
  ['cafe', ['ca', 'fe']],
  ['risque', ['ris', 'que']],
  ['blase', ['bla', 'se']],
  ['frappe', ['frap', 'pe']],
  ['protege', ['pro', 'te', 'ge']],
  ['touche', ['tou', 'che']],
  ['souffle', ['souf', 'fle']],
  ['macrame', ['ma', 'cra', 'me']],
  ['ole', ['o', 'le']],
  ['melee', ['me', 'lee']],
  ['matinee', ['ma', 'ti', 'nee']],

  // Latin/Greek-based words (14 words)
  ['recipe', ['re', 'ci', 'pe']],
  ['apostrophe', ['a', 'po', 'stro', 'phe']],
  ['catastrophe', ['ca', 'ta', 'stro', 'phe']],
  ['epitome', ['e', 'pi', 'to', 'me']],
  ['sesame', ['se', 'sa', 'me']],
  ['posse', ['pos', 'se']],
  ['acne', ['ac', 'ne']],
  ['simile', ['si', 'mi', 'le']],
  ['syncope', ['syn', 'co', 'pe']],
  ['psyche', ['psy', 'che']],
  ['karate', ['ka', 'ra', 'te']],
  ['vigilante', ['vi', 'gi', 'lan', 'te']],
  ['anemone', ['a', 'ne', 'mo', 'ne']],
  ['calliope', ['cal', 'li', 'o', 'pe']],

  // Native American words (4 words)
  ['apache', ['a', 'pa', 'che']],
  ['comanche', ['co', 'man', 'che']],
  ['osage', ['o', 'sa', 'ge']],
  ['tarhe', ['tar', 'he']],

  // Consonant+i pattern words requiring special handling
  ['obedient', ['o', 'be', 'di', 'ent']],
  ['expedient', ['ex', 'pe', 'di', 'ent']],
  ['ingredient', ['in', 'gre', 'di', 'ent']]
]);

// Common prefixes
export const PREFIXES = new Map<string, string[]>([
  ['un', ['un']],          // un-happy
  ['re', ['re']],          // re-do
  ['in', ['in']],          // in-active
  ['im', ['im']],          // im-possible
  ['dis', ['dis']],        // dis-agree
  ['mis', ['mis']],        // mis-take
  ['pre', ['pre']],        // pre-view
  ['post', ['post']],      // post-war
  ['over', ['o', 'ver']],  // o-ver-do
  ['under', ['un', 'der']], // un-der-stand
  ['out', ['out']],        // out-side
  ['sub', ['sub']],        // sub-way
  ['super', ['su', 'per']], // su-per-man
  ['inter', ['in', 'ter']], // in-ter-act
  ['trans', ['trans']],    // trans-port
  ['anti', ['an', 'ti']],  // an-ti-body
  ['semi', ['sem', 'i']],  // sem-i-circle
  ['non', ['non']],        // non-sense
  ['de', ['de']],          // de-code
  ['ex', ['ex']],          // ex-port
  ['sur', ['sur']],        // sur-prise, sur-face
]);

// Universal suffix patterns that create consonant+i syllables
export const CONSONANT_I_SUFFIXES = [
  'ia',      // me-di-a, encyclope-di-a
  'ion',     // cham-pi-on, dande-li-on
  'ian',     // Ca-na-di-an, In-di-an
  'ious',    // glor-i-ous, spur-i-ous
  'ial',     // ra-di-al, cra-ni-al
  'ient',    // o-be-di-ent, expe-di-ent
  'ience',   // ex-per-i-ence, au-di-ence
];

// R-controlled vowel + ious words that need special handling
export const R_CONTROLLED_IOUS_WORDS = new Map<string, string[]>([
  ['spurious', ['spur', 'i', 'ous']],
  ['curious', ['cur', 'i', 'ous']],
  ['furious', ['fur', 'i', 'ous']],
  ['glorious', ['glor', 'i', 'ous']],
  ['luxurious', ['lux', 'ur', 'i', 'ous']],
  ['injurious', ['in', 'jur', 'i', 'ous']],
  ['penurious', ['pe', 'nur', 'i', 'ous']],
]);

// R-controlled vowel + ience words that need special handling
export const R_CONTROLLED_IENCE_WORDS = new Map<string, string[]>([
  ['experience', ['ex', 'per', 'i', 'ence']],
  ['inexperience', ['in', 'ex', 'per', 'i', 'ence']],
]);

// Special eous words that are 1 syllable (override the default 2-syllable split)
export const SINGLE_SYLLABLE_EOUS_WORDS = new Map<string, string[]>([
  ['gorgeous', ['gor', 'geous']],     // gor-geous (1 syllable ending)
  ['righteous', ['right', 'eous']],   // right-eous (1 syllable ending)
]);

export class MorphologicalAnalyzer {
  /**
   * Check if word ends with consonant+i suffix pattern
   */
  private detectConsonantISuffix(word: string): { suffix: string, consonant: string, position: number } | null {
    const lowerWord = word.toLowerCase();

    for (const suffix of CONSONANT_I_SUFFIXES) {
      if (lowerWord.endsWith(suffix)) {
        const suffixStart = lowerWord.length - suffix.length;
        if (suffixStart > 0) {
          const precedingChar = lowerWord[suffixStart - 1];
          // Check if preceded by consonant (not vowel or 'y')
          if (precedingChar && !/[aeiouy]/.test(precedingChar)) {
            return {
              suffix: suffix,
              consonant: precedingChar,
              position: suffixStart - 1
            };
          }
        }
      }
    }

    return null;
  }

  /**
   * Analyze word for morphological components
   */
  analyzeWord(word: string): Morpheme[] {
    const lowerWord = word.toLowerCase();

    // Check for R-controlled + ience words first (highest priority for these specific cases)
    if (R_CONTROLLED_IENCE_WORDS.has(lowerWord)) {
      const syllables = R_CONTROLLED_IENCE_WORDS.get(lowerWord)!;
      return [{
        text: word,
        type: 'root',
        position: 0,
        syllables: [...syllables]
      }];
    }

    // Check for R-controlled + ious words second (highest priority for these specific cases)
    if (R_CONTROLLED_IOUS_WORDS.has(lowerWord)) {
      const syllables = R_CONTROLLED_IOUS_WORDS.get(lowerWord)!;
      return [{
        text: word,
        type: 'root',
        position: 0,
        syllables: [...syllables]
      }];
    }

    // Check for false flag silent-e words second (high priority)
    if (FALSE_FLAG_SILENT_E_OVERRIDES.has(lowerWord)) {
      const syllables = FALSE_FLAG_SILENT_E_OVERRIDES.get(lowerWord)!;
      return [{
        text: word,
        type: 'root',
        position: 0,
        syllables: [...syllables]
      }];
    }

    

    const morphemes: Morpheme[] = [];
    let remainingWord = word.toLowerCase();
    let currentPosition = 0;

    // 1. Check for prefixes
    for (const [prefix, syllables] of PREFIXES) {
      if (remainingWord.startsWith(prefix)) {
        morphemes.push({
          text: prefix,
          type: 'prefix',
          position: currentPosition,
          syllables: [...syllables]
        });
        remainingWord = remainingWord.slice(prefix.length);
        currentPosition += prefix.length;
        break; // Only one prefix for now
      }
    }

    // 2. Check for suffixes (from longest to shortest)
    // First check divisible suffixes, then undividable ones
    const allSuffixes = [
      ...Array.from(DIVISIBLE_SUFFIXES.keys()).map(k => ({ key: k, map: DIVISIBLE_SUFFIXES })),
      ...Array.from(UNDIVIDABLE_SUFFIXES.keys()).map(k => ({ key: k, map: UNDIVIDABLE_SUFFIXES }))
    ].sort((a, b) => b.key.length - a.key.length);

    for (const { key: suffix, map } of allSuffixes) {
      if (remainingWord.endsWith(suffix)) {
        // Special handling for eous
        let suffixSyllables;
        if (suffix === 'eous' && SINGLE_SYLLABLE_EOUS_WORDS.has(lowerWord)) {
          suffixSyllables = ['eous']; // Keep as 1 syllable for special words
        } else {
          suffixSyllables = map.get(suffix)!;
        }

        let suffixStart = currentPosition + remainingWord.length - suffix.length;
        let actualSuffix = suffix;

        // Special handling for -ingly suffix to create open syllables
        if (suffix === 'ingly') {
          // Check if there's a consonant before "ingly" that should move to create open syllable
          const beforeInglySuffix = remainingWord.slice(0, -suffix.length);
          if (beforeInglySuffix.length > 0) {
            const lastChar = beforeInglySuffix.slice(-1);
            // If last character is a consonant and the syllable before would not be a root word
            if (!/[aeiouAEIOU]/.test(lastChar)) {
              // Move the consonant to the suffix to create open syllable
              actualSuffix = lastChar + 'ingly';
              suffixSyllables = [lastChar + 'ing', 'ly'];
              suffixStart = currentPosition + remainingWord.length - actualSuffix.length;
              remainingWord = remainingWord.slice(0, -(actualSuffix.length));
            } else {
              remainingWord = remainingWord.slice(0, -suffix.length);
            }
          } else {
            remainingWord = remainingWord.slice(0, -suffix.length);
          }
        } else {
          remainingWord = remainingWord.slice(0, -suffix.length);
        }

        morphemes.push({
          text: actualSuffix,
          type: 'suffix',
          position: suffixStart,
          syllables: [...suffixSyllables]
        });

        break; // Only one suffix for now
      }
    }

    // 3. What's left is the root
    if (remainingWord.length > 0) {
      morphemes.splice(morphemes.findIndex(m => m.type === 'suffix'), 0, {
        text: remainingWord,
        type: 'root',
        position: currentPosition,
        syllables: [] // Will be filled by syllabification
      });
    }

    return morphemes;
  }

  /**
   * Check if a position is at a morpheme boundary
   */
  isMorphemeBoundary(word: string, position: number): boolean {
    const morphemes = this.analyzeWord(word);

    for (const morpheme of morphemes) {
      if (morpheme.position === position || 
          morpheme.position + morpheme.text.length === position) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get morphological hints for syllabification
   */
  getMorphologicalHints(word: string): { boundaries: number[], preservedUnits: Array<{start: number, end: number, syllables: string[]}> } {
    const lowerWord = word.toLowerCase();

    // Check for R-controlled + ience words first (highest priority complete word overrides)
    if (R_CONTROLLED_IENCE_WORDS.has(lowerWord)) {
      const syllables = R_CONTROLLED_IENCE_WORDS.get(lowerWord)!;
      return {
        boundaries: [], // No boundaries needed for complete overrides
        preservedUnits: [{
          start: 0,
          end: word.length,
          syllables: [...syllables]
        }]
      };
    }

    // Check for R-controlled + ious words second (highest priority complete word overrides)
    if (R_CONTROLLED_IOUS_WORDS.has(lowerWord)) {
      const syllables = R_CONTROLLED_IOUS_WORDS.get(lowerWord)!;
      return {
        boundaries: [], // No boundaries needed for complete overrides
        preservedUnits: [{
          start: 0,
          end: word.length,
          syllables: [...syllables]
        }]
      };
    }

    // Check for false flag silent-e words third (high priority complete word overrides)
    if (FALSE_FLAG_SILENT_E_OVERRIDES.has(lowerWord)) {
      const syllables = FALSE_FLAG_SILENT_E_OVERRIDES.get(lowerWord)!;
      return {
        boundaries: [], // No boundaries needed for complete overrides
        preservedUnits: [{
          start: 0,
          end: word.length,
          syllables: [...syllables]
        }]
      };
    }

    // Check for consonant+i suffix patterns second
    const consonantISuffix = this.detectConsonantISuffix(word);
    if (consonantISuffix) {
      const { suffix, consonant, position } = consonantISuffix;
      const beforeConsonant = word.slice(0, position);
      const consonantIPart = consonant + 'i';
      const restOfSuffix = suffix.slice(1); // Remove the 'i' since it goes with consonant

      // If there's a root before the consonant+i+suffix
      if (beforeConsonant.length > 0) {
        return {
          boundaries: [position, position + 2], // Before consonant and after consonant+i
          preservedUnits: [
            {
              start: position,
              end: position + 2,
              syllables: [consonantIPart]
            },
            {
              start: position + 2,
              end: word.length,
              syllables: [restOfSuffix]
            }
          ]
        };
      }
    }

    const morphemes = this.analyzeWord(word);
    const boundaries: number[] = [];
    const preservedUnits: Array<{start: number, end: number, syllables: string[]}> = [];

    for (const morpheme of morphemes) {
      // Add boundaries
      boundaries.push(morpheme.position);
      if (morpheme.position + morpheme.text.length < word.length) {
        boundaries.push(morpheme.position + morpheme.text.length);
      }

      // Add preserved units (prefixes and suffixes with known syllables)
      if (morpheme.syllables.length > 0) {
        preservedUnits.push({
          start: morpheme.position,
          end: morpheme.position + morpheme.text.length,
          syllables: morpheme.syllables
        });
      }
    }

    return { boundaries, preservedUnits };
  }

  /**
   * Special rule for -ed suffix
   */
  handleEdSuffix(rootWord: string): string[] {
    const lastChar = rootWord.slice(-1).toLowerCase();

    // -ed creates new syllable only after 't' or 'd'
    if (lastChar === 't' || lastChar === 'd') {
      return ['ed']; // Separate syllable
    } else {
      return []; // Joins with previous syllable
    }
  }

  /**
   * Check if a two-character sequence is an R-controlled vowel pattern
   */
  private isRControlledVowel(pattern: string): boolean {
    // R-controlled vowel patterns that should stay together as units
    const rControlledPatterns = [
      'er', 'ir', 'ur', 'or', 'ar'
    ];

    return rControlledPatterns.includes(pattern.toLowerCase());
  }
}