
import { VowelDetector } from './vowel-detector.js';

export interface MorphologicalAnalysis {
  root: string;
  prefixes: string[];
  suffixes: string[];
  syllables: string[];
  isCompound: boolean;
  compoundParts?: string[];
}

export class MorphologicalAnalyzer {
  private vowelDetector = new VowelDetector();

  // Comprehensive morphological overrides for educational clarity
  private readonly MORPHOLOGICAL_OVERRIDES = new Map<string, string[]>([
    // Common -ing words (root + suffix)
    ['testing', ['test', 'ing']],
    ['running', ['run', 'ning']],
    ['walking', ['walk', 'ing']],
    ['talking', ['talk', 'ing']],
    ['reading', ['read', 'ing']],
    ['writing', ['writ', 'ing']],
    ['looking', ['look', 'ing']],
    ['playing', ['play', 'ing']],
    ['working', ['work', 'ing']],
    ['jumping', ['jump', 'ing']],
    ['swimming', ['swim', 'ming']],
    ['singing', ['sing', 'ing']],
    ['dancing', ['danc', 'ing']],
    ['helping', ['help', 'ing']],
    ['cleaning', ['clean', 'ing']],
    ['teaching', ['teach', 'ing']],
    ['learning', ['learn', 'ing']],
    ['thinking', ['think', 'ing']],
    ['feeling', ['feel', 'ing']],
    ['knowing', ['know', 'ing']],

    // Common -ly adverbs
    ['surprisingly', ['sur', 'pri', 'sing', 'ly']],
    ['certainly', ['cer', 'tain', 'ly']],
    ['definitely', ['def', 'i', 'nite', 'ly']],
    ['completely', ['com', 'plete', 'ly']],
    ['immediately', ['im', 'me', 'di', 'ate', 'ly']],
    ['carefully', ['care', 'ful', 'ly']],
    ['perfectly', ['per', 'fect', 'ly']],
    ['hopefully', ['hope', 'ful', 'ly']],
    ['suddenly', ['sud', 'den', 'ly']],
    ['finally', ['fi', 'nal', 'ly']],
    ['probably', ['prob', 'a', 'bly']],
    ['possibly', ['pos', 'si', 'bly']],
    ['especially', ['es', 'pe', 'cial', 'ly']],
    ['generally', ['gen', 'er', 'al', 'ly']],
    ['basically', ['ba', 'sic', 'al', 'ly']],
    ['naturally', ['nat', 'u', 'ral', 'ly']],
    ['originally', ['o', 'ri', 'gi', 'nal', 'ly']],
    ['particularly', ['par', 'tic', 'u', 'lar', 'ly']],
    ['specifically', ['spe', 'cif', 'i', 'cal', 'ly']],
    ['automatically', ['au', 'to', 'mat', 'i', 'cal', 'ly']],
    ['unfortunately', ['un', 'for', 'tu', 'nate', 'ly']],
    ['significantly', ['sig', 'nif', 'i', 'cant', 'ly']],
    ['considerably', ['con', 'sid', 'er', 'a', 'bly']],
    ['substantially', ['sub', 'stan', 'tial', 'ly']],
    ['fundamentally', ['fun', 'da', 'men', 'tal', 'ly']],
    ['internationally', ['in', 'ter', 'na', 'tion', 'al', 'ly']],
    ['unanimously', ['u', 'na', 'ni', 'mous', 'ly']],

    // Common -tion/-sion words
    ['international', ['in', 'ter', 'na', 'tion', 'al']],
    ['educational', ['ed', 'u', 'ca', 'tion', 'al']],
    ['traditional', ['tra', 'di', 'tion', 'al']],
    ['professional', ['pro', 'fes', 'sion', 'al']],
    ['constitutional', ['con', 'sti', 'tu', 'tion', 'al']],
    ['organizational', ['or', 'ga', 'ni', 'za', 'tion', 'al']],
    ['informational', ['in', 'for', 'ma', 'tion', 'al']],
    ['recreational', ['rec', 're', 'a', 'tion', 'al']],
    ['conversational', ['con', 'ver', 'sa', 'tion', 'al']],
    ['operational', ['op', 'er', 'a', 'tion', 'al']],

    // Special cases - 33 false flag silent-e words
    ['apostrophe', ['a', 'pos', 'tro', 'phe']],
    ['catastrophe', ['ca', 'tas', 'tro', 'phe']],
    ['epitome', ['e', 'pit', 'o', 'me']],
    ['hyperbole', ['hy', 'per', 'bo', 'le']],
    ['karaoke', ['ka', 'ra', 'o', 'ke']],
    ['recipe', ['rec', 'i', 'pe']],
    ['sesame', ['ses', 'a', 'me']],
    ['simile', ['si', 'mi', 'le']],
    ['syncope', ['syn', 'co', 'pe']],
    ['acne', ['ac', 'ne']],
    ['adobe', ['a', 'do', 'be']],
    ['anime', ['a', 'ni', 'me']],
    ['apache', ['a', 'pa', 'che']],
    ['blonde', ['blonde']],
    ['brunette', ['bru', 'nette']],
    ['cayenne', ['ca', 'yenne']],
    ['cheese', ['cheese']],
    ['cheyenne', ['chey', 'enne']],
    ['choose', ['choose']],
    ['coyote', ['coy', 'o', 'te']],
    ['cringe', ['cringe']],
    ['dengue', ['den', 'gue']],
    ['fudge', ['fudge']],
    ['goose', ['goose']],
    ['hypotenuse', ['hy', 'pot', 'e', 'nuse']],
    ['juice', ['juice']],
    ['loose', ['loose']],
    ['moose', ['moose']],
    ['noose', ['noose']],
    ['people', ['peo', 'ple']],
    ['poodle', ['poo', 'dle']],
    ['purple', ['pur', 'ple']],
    ['soothe', ['soothe']],
  ]);

  // Comprehensive suffix detection
  private readonly COMPREHENSIVE_SUFFIXES = new Set([
    'ing', 'ed', 'er', 'est', 'ly', 'ness', 'ment', 'tion', 'sion', 'al', 'ous', 'ious', 'eous',
    'ful', 'less', 'able', 'ible', 'ance', 'ence', 'ity', 'ty', 'ism', 'ist', 'ive', 'ative',
    'itive', 'ory', 'ary', 'ery', 'ry', 'ic', 'ical', 'tic', 'ous', 'uous', 'eous', 'ious',
    'tial', 'cial', 'tia', 'cia', 'tious', 'cious', 'tian', 'cian', 'ture', 'sure', 'ure',
    'age', 'ade', 'ide', 'ude', 'ode', 'ine', 'ene', 'ane', 'one', 'une', 'yte', 'ite', 'ate',
    'ote', 'ute', 'ive', 'ave', 'ove', 'ize', 'ise', 'yze', 'yse', 'fy', 'ify', 'efy', 'ward',
    'wise', 'like', 'ship', 'hood', 'dom', 'th', 'ese', 'ose', 'ase', 'ise', 'use', 'ouse',
    'ouse', 'ause', 'euse', 'ouse', 'ence', 'ance', 'ency', 'ancy', 'ent', 'ant', 'ient',
    'iant', 'ment', 'gent', 'dent', 'rent', 'sent', 'tent', 'vent', 'went', 'yent', 'zent'
  ]);

  // Common prefixes
  private readonly COMMON_PREFIXES = new Set([
    'un', 're', 'in', 'im', 'il', 'ir', 'dis', 'mis', 'over', 'under', 'out', 'up', 'pre', 'post',
    'anti', 'pro', 'co', 'de', 'ex', 'inter', 'intra', 'multi', 'non', 'sub', 'super', 'trans',
    'ultra', 'auto', 'semi', 'micro', 'macro', 'mega', 'mini', 'pseudo', 'quasi', 'counter'
  ]);

  /**
   * Analyze a word for morphological structure
   */
  analyzeWord(word: string): MorphologicalAnalysis {
    const lowerWord = word.toLowerCase();
    
    // Check for complete word overrides first
    if (this.MORPHOLOGICAL_OVERRIDES.has(lowerWord)) {
      const syllables = this.MORPHOLOGICAL_OVERRIDES.get(lowerWord)!;
      return {
        root: syllables[0],
        prefixes: [],
        suffixes: syllables.slice(1),
        syllables,
        isCompound: false
      };
    }

    // Handle -ed past tense with phonetic rules
    if (lowerWord.endsWith('ed')) {
      const rootWord = lowerWord.slice(0, -2);
      
      // Check if root word ends in 't' or 'd' sound (creates new syllable)
      if (rootWord.endsWith('t') || rootWord.endsWith('d')) {
        return {
          root: rootWord,
          prefixes: [],
          suffixes: ['ed'],
          syllables: [rootWord, 'ed'],
          isCompound: false
        };
      } else {
        // -ed joins with previous syllable
        return {
          root: rootWord,
          prefixes: [],
          suffixes: ['ed'],
          syllables: [rootWord + 'ed'],
          isCompound: false
        };
      }
    }

    // Detect other common suffixes
    for (const suffix of this.COMPREHENSIVE_SUFFIXES) {
      if (lowerWord.endsWith(suffix) && lowerWord.length > suffix.length) {
        const rootWord = lowerWord.slice(0, -suffix.length);
        
        // Simple morphological boundary detection
        return {
          root: rootWord,
          prefixes: [],
          suffixes: [suffix],
          syllables: [rootWord, suffix],
          isCompound: false
        };
      }
    }

    // Detect common prefixes
    for (const prefix of this.COMMON_PREFIXES) {
      if (lowerWord.startsWith(prefix) && lowerWord.length > prefix.length) {
        const remainder = lowerWord.slice(prefix.length);
        
        return {
          root: remainder,
          prefixes: [prefix],
          suffixes: [],
          syllables: [prefix, remainder],
          isCompound: false
        };
      }
    }

    // Default: treat as single root word
    return {
      root: lowerWord,
      prefixes: [],
      suffixes: [],
      syllables: [lowerWord],
      isCompound: false
    };
  }

  /**
   * Check if a word has morphological boundaries that should be preserved
   */
  hasMorphologicalBoundaries(word: string): boolean {
    const lowerWord = word.toLowerCase();
    
    // Check for complete overrides
    if (this.MORPHOLOGICAL_OVERRIDES.has(lowerWord)) {
      return true;
    }

    // Check for common suffixes
    for (const suffix of this.COMPREHENSIVE_SUFFIXES) {
      if (lowerWord.endsWith(suffix) && lowerWord.length > suffix.length) {
        return true;
      }
    }

    // Check for common prefixes
    for (const prefix of this.COMMON_PREFIXES) {
      if (lowerWord.startsWith(prefix) && lowerWord.length > prefix.length) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get morphological syllable boundaries
   */
  getMorphologicalSyllables(word: string): string[] | null {
    const analysis = this.analyzeWord(word);
    
    if (analysis.prefixes.length > 0 || analysis.suffixes.length > 0) {
      return analysis.syllables;
    }
    
    return null;
  }
}
