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

// Comprehensive suffix list that should NOT be divided
export const UNDIVIDABLE_SUFFIXES = new Map<string, string[]>([
  // -ence family
  ['ence', ['ence']],      // ex-per-i-ence
  ['ience', ['ience']],    // con-ven-ience
  ['tience', ['tience']],  // pa-tience
  ['cience', ['cience']],  // con-science

  // -tia/-tion family
  ['tia', ['tia']],        // de-men-tia
  ['tion', ['tion']],      // na-tion
  ['tian', ['tian']],      // Egyp-tian
  ['tious', ['tious']],    // cau-tious
  ['tial', ['tial']],      // par-tial
  ['tient', ['tient']],    // pa-tient
  ['tional', ['tion', 'al']], // na-tion-al

  // -cia/-cial family
  ['cia', ['cia']],        // Mar-cia
  ['cion', ['cion']],      // su-spi-cion
  ['cian', ['cian']],      // mu-si-cian
  ['cious', ['cious']],    // pre-cious
  ['cial', ['cial']],      // spe-cial
  ['cient', ['cient']],    // suf-fi-cient

  // -sia/-sion family
  ['sia', ['sia']],        // A-sia
  ['sion', ['sion']],      // ten-sion
  ['sian', ['sian']],      // Rus-sian
  ['sious', ['sious']],    // am-bi-tious (variant)

  // -gia/-gion family
  ['gia', ['gia']],        // Geor-gia
  ['gion', ['gion']],      // re-gion
  ['gian', ['gian']],      // Bel-gian
  ['gious', ['gious']],    // re-li-gious

  // Other common suffixes
  ['ous', ['ous']],        // fa-mous
  ['eous', ['eous']],      // cour-a-geous
  ['uous', ['uous']],      // con-tin-u-ous

  // Standard suffixes
  ['ing', ['ing']],        // walk-ing
  ['ed', ['ed']],          // walk-ed (but see special rules)
  ['er', ['er']],          // walk-er
  ['est', ['est']],        // tall-est
  ['ly', ['ly']],          // quick-ly
  ['ness', ['ness']],      // kind-ness
  ['ment', ['ment']],      // pay-ment
  ['ful', ['ful']],        // care-ful
  ['less', ['less']],      // care-less
  ['able', ['a', 'ble']],  // read-a-ble
  ['ible', ['i', 'ble']],  // vis-i-ble
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
  ['tarhe', ['tar', 'he']]
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
    
    // Check for false flag silent-e words first (highest priority)
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
    const suffixCandidates = Array.from(UNDIVIDABLE_SUFFIXES.keys())
      .sort((a, b) => b.length - a.length);

    for (const suffix of suffixCandidates) {
      if (remainingWord.endsWith(suffix)) {
        const suffixSyllables = UNDIVIDABLE_SUFFIXES.get(suffix)!;
        const suffixStart = currentPosition + remainingWord.length - suffix.length;

        // Insert suffix at the beginning so we can add it to morphemes in order
        morphemes.push({
          text: suffix,
          type: 'suffix',
          position: suffixStart,
          syllables: [...suffixSyllables]
        });

        remainingWord = remainingWord.slice(0, -suffix.length);
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

    // Check for consonant+i suffix patterns first
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
}