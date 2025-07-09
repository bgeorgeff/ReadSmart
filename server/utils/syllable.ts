// CMU Dictionary phoneme to syllable converter
class CMUSyllabifier {
  private dictionary: Map<string, string[]> = new Map();
  private initialized = false;

  // ARPAbet vowel phonemes that indicate syllable cores
  private readonly VOWEL_PHONEMES = new Set([
    'AA', 'AE', 'AH', 'AO', 'AW', 'AY', 'EH', 'ER', 'EY', 'IH', 'IY', 'OW', 'OY', 'UH', 'UW'
  ]);

  // Morphological overrides - root words + suffixes for educational clarity
  private readonly MORPHOLOGICAL_OVERRIDES = new Map([
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
    ['originally', ['o', 'rig', 'i', 'nal', 'ly']],
    ['personally', ['per', 'son', 'al', 'ly']],
    ['actually', ['ac', 'tu', 'al', 'ly']],
    ['literally', ['lit', 'er', 'al', 'ly']],
    ['international', ['in', 'ter', 'na', 'tion', 'al']],
    ['national', ['na', 'tion', 'al']],
    ['education', ['ed', 'u', 'ca', 'tion']],
    ['information', ['in', 'for', 'ma', 'tion']],
    ['organization', ['or', 'gan', 'i', 'za', 'tion']],
    ['traditional', ['tra', 'di', 'tion', 'al']],
    ['professional', ['pro', 'fes', 'sion', 'al']],
    ['constitutional', ['con', 'sti', 'tu', 'tion', 'al']],
    ['educational', ['ed', 'u', 'ca', 'tion', 'al']],
    ['exceptional', ['ex', 'cep', 'tion', 'al']],
    ['unanimously', ['u', 'na', 'ni', 'mous', 'ly']],
    // -ed past tense words with root word preservation
    ['wanted', ['want', 'ed']],
    ['started', ['start', 'ed']],
    ['tested', ['test', 'ed']],
    ['needed', ['need', 'ed']],

  ]);

  // Consonant clusters that can begin English words
  private readonly WORD_INITIAL_CLUSTERS = new Set([
    'bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr', 'sc', 'sk', 'sl', 'sm', 'sn', 
    'sp', 'st', 'sw', 'th', 'tr', 'tw', 'ch', 'sh', 'wh', 'qu', 'scr', 'spr', 'str', 'spl', 'squ'
  ]);

  // Consonant clusters that CANNOT begin English words (should be split)
  private readonly NEVER_INITIAL_CLUSTERS = new Set([
    'nt', 'nd', 'nk', 'mp', 'mb', 'ng', 'ld', 'rd', 'ct', 'pt', 'ft', 'xt'
  ]);

  // Consonant combinations that should stay together (even if they can't start words)
  private readonly CONSONANT_CLUSTERS_TO_PRESERVE = new Set([
    'ng', 'nk', 'nd', 'nt', 'mp', 'mb', 'ld', 'rd', 'st', 'sk', 'sp'
  ]);

  // Vowel+ng patterns that should stay together as syllable endings
  private readonly VOWEL_NG_PATTERNS = new Set([
    'ing', 'ang', 'ong', 'ung', 'eng'
  ]);

  // Common root words (for syllabification)
  private readonly COMMON_ROOT_WORDS = new Set([
    'act', 'add', 'air', 'all', 'and', 'art', 'ask', 'bad', 'ball', 'bank', 'bar', 'base', 'bat', 'bear', 'beat', 'bed', 'bell', 'best', 'big', 'bill', 'bit', 'bite', 'black', 'blood', 'blue', 'boat', 'body', 'bone', 'book', 'born', 'both', 'box', 'boy', 'brain', 'bread', 'break', 'bright', 'bring', 'broad', 'brown', 'build', 'burn', 'bus', 'buy', 'call', 'can', 'car', 'card', 'care', 'carry', 'case', 'cat', 'catch', 'cause', 'cell', 'cent', 'chair', 'chance', 'change', 'charge', 'check', 'child', 'city', 'claim', 'class', 'clean', 'clear', 'close', 'cloud', 'club', 'coat', 'cold', 'color', 'come', 'cook', 'cool', 'copy', 'corn', 'cost', 'count', 'court', 'cover', 'cross', 'cry', 'cup', 'dark', 'date', 'day', 'dead', 'deal', 'dear', 'death', 'deep', 'deer', 'degree', 'die', 'dig', 'direct', 'dirt', 'dish', 'dive', 'doctor', 'dog', 'door', 'doubt', 'down', 'draw', 'dream', 'dress', 'drink', 'drive', 'drop', 'dry', 'due', 'east', 'easy', 'eat', 'edge', 'egg', 'eight', 'else', 'end', 'equal', 'even', 'event', 'ever', 'every', 'eye', 'face', 'fact', 'fail', 'fair', 'fall', 'far', 'farm', 'fast', 'fat', 'father', 'fear', 'feed', 'feel', 'feet', 'fell', 'felt', 'few', 'field', 'fight', 'figure', 'fill', 'film', 'final', 'find', 'fine', 'finger', 'fire', 'firm', 'fish', 'fit', 'five', 'fix', 'flag', 'flat', 'floor', 'flow', 'flower', 'fly', 'fold', 'follow', 'food', 'foot', 'for', 'force', 'form', 'found', 'four', 'free', 'fresh', 'friend', 'from', 'front', 'fruit', 'full', 'fun', 'game', 'garden', 'gas', 'gate', 'gather', 'gave', 'gear', 'general', 'get', 'gift', 'girl', 'give', 'glad', 'glass', 'go', 'goal', 'god', 'gold', 'good', 'grass', 'great', 'green', 'ground', 'group', 'grow', 'guess', 'guide', 'gun', 'hair', 'half', 'hall', 'hand', 'hang', 'happen', 'happy', 'hard', 'hat', 'hate', 'have', 'he', 'head', 'hear', 'heart', 'heat', 'heavy', 'held', 'hell', 'help', 'her', 'here', 'high', 'hill', 'him', 'hip', 'hire', 'his', 'hit', 'hold', 'hole', 'home', 'hope', 'horse', 'hospital', 'hot', 'hotel', 'hour', 'house', 'how', 'huge', 'human', 'hunt', 'hurt', 'ice', 'idea', 'if', 'image', 'import', 'inch', 'info', 'inside', 'instead', 'into', 'iron', 'issue', 'item', 'job', 'join', 'joke', 'judge', 'jump', 'just', 'keep', 'key', 'kid', 'kill', 'kind', 'king', 'kiss', 'knee', 'knife', 'knock', 'know', 'lab', 'lack', 'lady', 'lake', 'land', 'large', 'last', 'late', 'laugh', 'law', 'lay', 'lead', 'learn', 'least', 'leave', 'left', 'leg', 'lend', 'less', 'let', 'letter', 'level', 'lie', 'life', 'lift', 'light', 'like', 'line', 'lip', 'list', 'listen', 'little', 'live', 'load', 'local', 'lock', 'long', 'look', 'loose', 'lose', 'loss', 'lot', 'loud', 'love', 'low', 'luck', 'lunch', 'machine', 'main', 'make', 'male', 'man', 'many', 'map', 'mark', 'market', 'marry', 'mass', 'master', 'match', 'matter', 'may', 'meal', 'mean', 'meat', 'meet', 'member', 'memory', 'men', 'metal', 'method', 'mid', 'middle', 'might', 'mile', 'milk', 'mind', 'mine', 'minute', 'mirror', 'miss', 'mix', 'model', 'moment', 'money', 'month', 'moon', 'more', 'morning', 'most', 'mother', 'motion', 'mount', 'mouse', 'mouth', 'move', 'much', 'mud', 'music', 'must', 'my', 'nail', 'name', 'narrow', 'nation', 'near', 'neck', 'need', 'nerve', 'nest', 'net', 'new', 'news', 'next', 'nice', 'night', 'nine', 'no', 'noble', 'nod', 'noise', 'none', 'noon', 'north', 'nose', 'note', 'novel', 'now', 'number', 'nurse', 'nut', 'object', 'ocean', 'offer', 'office', 'often', 'oil', 'old', 'once', 'one', 'only', 'open', 'opera', 'opinion', 'order', 'other', 'our', 'out', 'over', 'own', 'pace', 'pack', 'page', 'pain', 'paint', 'pair', 'palace', 'paper', 'parent', 'park', 'part', 'party', 'pass', 'past', 'path', 'pattern', 'pause', 'pay', 'peace', 'peak', 'pen', 'pencil', 'people', 'perfect', 'period', 'person', 'pet', 'phase', 'phone', 'photo', 'pick', 'pie', 'piece', 'pig', 'pile', 'pill', 'pilot', 'pin', 'pink', 'pipe', 'pitch', 'place', 'plan', 'plane', 'plant', 'plastic', 'plate', 'play', 'please', 'plus', 'pocket', 'poem', 'point', 'poison', 'pole', 'police', 'policy', 'polite', 'pool', 'poor', 'pop', 'popular', 'port', 'pose', 'position', 'possible', 'post', 'pot', 'pound', 'pour', 'power', 'press', 'pretty', 'price', 'pride', 'print', 'prior', 'prison', 'private', 'prize', 'problem', 'process', 'produce', 'product', 'profile', 'program', 'project', 'promise', 'promote', 'proper', 'protect', 'proud', 'prove', 'provide', 'public', 'pull', 'pump', 'punch', 'punish', 'pupil', 'pure', 'purple', 'push', 'put', 'quality', 'quarter', 'queen', 'query', 'quest', 'quick', 'quiet', 'quit', 'quote', 'race', 'radio', 'rail', 'rain', 'raise', 'range', 'rank', 'rapid', 'rare', 'rate', 'ratio', 'raw', 'reach', 'react', 'read', 'ready', 'real', 'reason', 'recall', 'recent', 'recipe', 'record', 'red', 'reduce', 'refer', 'reflect', 'reform', 'refuse', 'regard', 'region', 'regret', 'regular', 'reject', 'relate', 'relax', 'release', 'relief', 'rely', 'remain', 'remark', 'remind', 'remote', 'remove', 'rent', 'repair', 'repeat', 'replace', 'reply', 'report', 'request', 'rescue', 'research', 'resign', 'resist', 'resolve', 'resort', 'resource', 'respect', 'respond', 'rest', 'result', 'resume', 'retail', 'retain', 'retire', 'return', 'reveal', 'review', 'reward', 'rice', 'rich', 'ride', 'right', 'ring', 'rise', 'risk', 'river', 'road', 'rob', 'rock', 'role', 'roll', 'roof', 'room', 'root', 'rope', 'rose', 'rough', 'round', 'route', 'row', 'royal', 'rub', 'rule', 'run', 'rural', 'rush', 'sad', 'safe', 'sail', 'salad', 'salary', 'sale', 'salt', 'same', 'sample', 'sand', 'sat', 'save', 'say', 'scale', 'scan', 'scare', 'scene', 'school', 'science', 'score', 'scratch', 'scream', 'screen', 'screw', 'sea', 'search', 'season', 'seat', 'second', 'secret', 'sector', 'see', 'seed', 'seek', 'seem', 'seize', 'select', 'sell', 'send', 'senior', 'sense', 'sentence', 'separate', 'series', 'serious', 'serve', 'session', 'set', 'settle', 'seven', 'severe', 'sex', 'shade', 'shadow', 'shake', 'shall', 'shape', 'share', 'sharp', 'she', 'sheep', 'sheet', 'shelf', 'shell', 'shift', 'shine', 'ship', 'shirt', 'shock', 'shoe', 'shoot', 'shop', 'shore', 'short', 'shot', 'should', 'shoulder', 'shout', 'show', 'side', 'sigh', 'sight', 'sign', 'silent', 'silk', 'silly', 'silver', 'similar', 'simple', 'since', 'sing', 'single', 'sink', 'sir', 'sister', 'sit', 'site', 'six', 'size', 'skill', 'skin', 'sky', 'slave', 'sleep', 'slice', 'slide', 'slim', 'slip', 'slow', 'small', 'smart', 'smell', 'smile', 'smoke', 'smooth', 'snap', 'snow', 'so', 'soap', 'social', 'sock', 'soft', 'soil', 'soldier', 'solid', 'solution', 'solve', 'some', 'son', 'song', 'soon', 'sorry', 'sort', 'soul', 'sound', 'soup', 'source', 'south', 'space', 'speak', 'speed', 'spell', 'spend', 'spice', 'spider', 'spike', 'spin', 'spirit', 'split', 'spoil', 'spoon', 'sport', 'spot', 'spray', 'spread', 'spring', 'square', 'squeeze', 'stable', 'stack', 'staff', 'stage', 'stain', 'stair', 'stake', 'stamp', 'stand', 'star', 'stare', 'start', 'state', 'station', 'stay', 'steady', 'steal', 'steam', 'steel', 'steep', 'step', 'stick', 'stiff', 'still', 'stock', 'stomach', 'stone', 'stop', 'store', 'storm', 'story', 'straight', 'strange', 'stream', 'street', 'stress', 'stretch', 'strict', 'strike', 'string', 'strip', 'stroke', 'strong', 'structure', 'struggle', 'student', 'studio', 'study', 'stuff', 'style', 'subject', 'subway', 'success', 'such', 'sudden', 'suffer', 'sugar', 'suggest', 'suit', 'summer', 'sun', 'super', 'supply', 'support', 'sure', 'surface', 'surge', 'surprise', 'surround', 'survey', 'sustain', 'swallow', 'swap', 'swear', 'sweat', 'sweet', 'swim', 'swing', 'switch', 'sword', 'symbol', 'system', 'table', 'tackle', 'tail', 'take', 'tale', 'talent', 'talk', 'tall', 'tank', 'tap', 'tape', 'target', 'task', 'taste', 'tax', 'taxi', 'tea', 'teach', 'team', 'tear', 'tech', 'tell', 'temp', 'ten', 'tenant', 'tend', 'tennis', 'tension', 'tent', 'term', 'test', 'text', 'than', 'thank', 'that', 'the', 'their', 'them', 'then', 'theory', 'there', 'these', 'they', 'thick', 'thin', 'thing', 'think', 'third', 'this', 'those', 'though', 'threat', 'three', 'throw', 'tie', 'tiger', 'tight', 'till', 'time', 'tin', 'tiny', 'tip', 'tire', 'tissue', 'title', 'to', 'toast', 'today', 'toe', 'together', 'toilet', 'token', 'tomato', 'tomorrow', 'ton', 'tone', 'tongue', 'tonight', 'tool', 'tooth', 'top', 'topic', 'toss', 'total', 'touch', 'tough', 'tour', 'toward', 'towel', 'tower', 'town', 'toy', 'trace', 'track', 'trade', 'traffic', 'trail', 'train', 'transfer', 'trap', 'trash', 'travel', 'tray', 'treat', 'tree', 'trend', 'trial', 'tribe', 'trick', 'trip', 'troop', 'trouble', 'truck', 'true', 'trunk', 'trust', 'truth', 'try', 'tube', 'tune', 'tunnel', 'turn', 'turtle', 'twelve', 'twenty', 'twice', 'twin', 'twist', 'two', 'type', 'typical', 'ugly', 'umbrella', 'unable', 'uncle', 'under', 'undergo', 'undo', 'unfair', 'unhappy', 'union', 'unique', 'unit', 'unite', 'unity', 'universe', 'unless', 'unlike', 'unload', 'unlock', 'unlucky', 'until', 'unusual', 'up', 'update', 'upon', 'upper', 'upset', 'urban', 'urge', 'urgent', 'us', 'use', 'useful', 'user', 'usual', 'utility', 'vacant', 'vague', 'valid', 'valley', 'value', 'van', 'vanish', 'vapor', 'variable', 'variant', 'vast', 'vault', 'vector', 'vehicle', 'veil', 'vein', 'vendor', 'venture', 'venue', 'verb', 'verify', 'version', 'versus', 'vessel', 'vest', 'veteran', 'via', 'viable', 'vibrant', 'victim', 'victory', 'video', 'view', 'village', 'violate', 'violent', 'violin', 'virtual', 'virtue', 'virus', 'visa', 'visible', 'vision', 'visit', 'visual', 'vital', 'vivid', 'vocal', 'vogue', 'voice', 'void', 'volume', 'voluntary', 'vote', 'vowel', 'voyage', 'wage', 'wagon', 'wait', 'wake', 'walk', 'wall', 'wallet', 'want', 'war', 'ward', 'ware', 'warm', 'warn', 'warp', 'warrior', 'wash', 'waste', 'watch', 'water', 'wave', 'wax', 'way', 'we', 'weak', 'wealth', 'weapon', 'wear', 'weather', 'web', 'wedding', 'week', 'weight', 'weird', 'welcome', 'well', 'went', 'were', 'west', 'wet', 'whale', 'what', 'wheat', 'wheel', 'when', 'where', 'which', 'while', 'whip', 'whisper', 'white', 'who', 'whole', 'why', 'wide', 'wife', 'wild', 'will', 'win', 'wind', 'window', 'wine', 'wing', 'wink', 'winner', 'winter', 'wipe', 'wire', 'wisdom', 'wise', 'wish', 'with', 'withdraw', 'within', 'without', 'witness', 'wolf', 'woman', 'wonder', 'wood', 'word', 'work', 'world', 'worry', 'worth', 'would', 'wound', 'wrap', 'wreck', 'wrist', 'write', 'wrong', 'yard', 'yarn', 'yeah', 'year', 'yell', 'yellow', 'yes', 'yesterday', 'yet', 'yield', 'you', 'young', 'your', 'youth', 'zone'
  ]);

  async initialize() {
    if (this.initialized) return;

    try {
      // Fetch CMU dictionary data
      const response = await fetch('https://raw.githubusercontent.com/Alexir/CMUdict/master/cmudict-0.7b');
      const text = await response.text();

      // Parse dictionary entries
      const lines = text.split('\n');
      for (const line of lines) {
        // Skip comments and empty lines
        if (line.startsWith(';;;') || line.trim() === '') continue;

        // Parse entry format: WORD PHONEME1 PHONEME2 ...
        const parts = line.trim().split(/\s+/);
        if (parts.length < 2) continue;

        const word = parts[0].toLowerCase();
        const phonemes = parts.slice(1);

        // Handle variant pronunciations like WORD(1), WORD(2) etc.
        const baseWord = word.replace(/\(\d+\)$/, '');

        // Convert phonemes to syllables
        const syllables = this.phonemesToSyllables(baseWord, phonemes);

        // Store in dictionary (prefer first pronunciation if multiple exist)
        if (!this.dictionary.has(baseWord)) {
          this.dictionary.set(baseWord, syllables);
        }
      }

      this.initialized = true;
      console.log(`CMU Dictionary initialized with ${this.dictionary.size} entries`);
    } catch (error) {
      console.error('Failed to initialize CMU dictionary:', error);
      this.initialized = false;
    }
  }

  private phonemesToSyllables(word: string, phonemes: string[]): string[] {
    // Check for morphological overrides first (morphological structure trumps other rules)
    const morphOverride = this.MORPHOLOGICAL_OVERRIDES.get(word.toLowerCase());
    if (morphOverride) {
      return morphOverride;
    }

    // Count syllables by counting vowel phonemes (each vowel = one syllable)
    const vowelCount = phonemes.filter(p => this.VOWEL_PHONEMES.has(p.replace(/[0-2]$/, ''))).length;

    if (vowelCount === 0) {
      return [word];
    }

    if (vowelCount === 1) {
      return [word];
    }

    // Use consonant cluster rules for multi-syllable words, pass phonemes for sound checking
    return this.splitWordWithConsonantClusterRules(word, vowelCount, phonemes);
  }

  private splitWordWithConsonantClusterRules(word: string, syllableCount: number, phonemes: string[] = []): string[] {
    if (syllableCount <= 1) {
      return [word];
    }

    const vowels = 'aeiouAEIOU';

    // Special case: check for c+i/e/y pattern at the beginning of the word
    // Only apply to specific words where it's clearly beneficial
    if (word.length >= 2 && word[0].toLowerCase() === 'c' && 'iey'.includes(word[1].toLowerCase())) {
      // Only apply to words like "cycle", "city", "cymbal" - NOT "center"
      const cVowelWords = ['city', 'cycle', 'cycling', 'cymbal', 'cypress'];
      if (cVowelWords.includes(word.toLowerCase())) {
        const restOfWord = word.slice(2);
        if (restOfWord.length > 0) {
          // Process rest of word separately 
          const vowelCount = restOfWord.split('').filter(c => vowels.includes(c)).length;
          if (vowelCount > 0) {
            const restSyllables = this.splitWordWithConsonantClusterRules(restOfWord, vowelCount);
            return [word.slice(0, 2), ...restSyllables];
          } else {
            return [word.slice(0, 2), restOfWord];
          }
        } else {
          return [word];
        }
      }
    }

    // Special case: check for g+i/e/y pattern at the beginning of the word if g makes /j/ sound
    if (word.length >= 2 && word[0].toLowerCase() === 'g' && 'iey'.includes(word[1].toLowerCase())) {
      // Check if g makes /j/ sound using phoneme data
      if (this.doesGMakeJSound(word, 0, phonemes)) {
        // Only apply to specific words where it's clearly beneficial
        const gVowelWords = ['giant', 'gentle', 'gym', 'giraffe', 'genius', 'ginger', 'gypsy'];
        if (gVowelWords.includes(word.toLowerCase())) {
          const restOfWord = word.slice(2);
          if (restOfWord.length > 0) {
            // Process rest of word separately 
            const vowelCount = restOfWord.split('').filter(c => vowels.includes(c)).length;
            if (vowelCount > 0) {
              const restSyllables = this.splitWordWithConsonantClusterRules(restOfWord, vowelCount);
              return [word.slice(0, 2), ...restSyllables];
            } else {
              return [word.slice(0, 2), restOfWord];
            }
          } else {
            return [word];
          }
        }
      }
    }

    // Find vowel positions to identify syllable cores using phoneme data
    const vowelPositions: number[] = [];

    if (phonemes.length > 0) {
      // Use phoneme data to identify actual vowel sounds
      const vowelPhonemes = phonemes.filter(p => this.VOWEL_PHONEMES.has(p.replace(/[0-2]$/, '')));

      // Map phonemes to approximate letter positions
      // This is a rough approximation - we need to find where each vowel sound occurs in the word
      let letterIndex = 0;
      let phonemeIndex = 0;

      while (letterIndex < word.length && phonemeIndex < phonemes.length) {
        const phoneme = phonemes[phonemeIndex].replace(/[0-2]$/, '');

        if (this.VOWEL_PHONEMES.has(phoneme)) {
          // Find the vowel letter(s) that represent this phoneme
          let vowelFound = false;
          for (let i = letterIndex; i < word.length; i++) {
            if (vowels.includes(word[i]) || (word[i].toLowerCase() === 'y' && i === word.length - 1)) {
              vowelPositions.push(i);
              letterIndex = i + 1;
              vowelFound = true;
              break;
            }
          }
          if (!vowelFound) {
            letterIndex++;
          }
        } else {
          // Skip consonant phonemes
          letterIndex++;
        }
        phonemeIndex++;
      }
    } else {
      // Fallback to letter-based detection if no phonemes
      for (let i = 0; i < word.length; i++) {
        // Include 'y' as a vowel when it's at the end of a word
        const isVowel = vowels.includes(word[i]) || (word[i].toLowerCase() === 'y' && i === word.length - 1);
        if (isVowel) {
          // Check if this is a new vowel cluster (not consecutive vowels)
          if (i === 0 || (!vowels.includes(word[i - 1]) && !(word[i - 1].toLowerCase() === 'y' && i - 1 === word.length - 1))) {
            vowelPositions.push(i);
          }
        }
      }
    }

    // If we don't have enough vowel clusters, fall back to simple splitting
    if (vowelPositions.length < syllableCount) {
      return this.simpleSyllableSplit(word, syllableCount);
    }

    // Apply consonant cluster rules
    const syllables: string[] = [];
    let currentStart = 0;

    for (let i = 0; i < vowelPositions.length - 1; i++) {
      const currentVowelPos = vowelPositions[i];
      const nextVowelPos = vowelPositions[i + 1];

      // Find consonants between vowels
      let consonantStart = currentVowelPos + 1;
      while (consonantStart < nextVowelPos && vowels.includes(word[consonantStart])) {
        consonantStart++;
      }

      let consonantEnd = nextVowelPos - 1;
      while (consonantEnd > consonantStart && vowels.includes(word[consonantEnd])) {
        consonantEnd--;
      }

      // Get the consonant cluster
      const consonantCluster = word.slice(consonantStart, consonantEnd + 1);
      let splitPoint: number;

      if (consonantCluster.length === 0) {
        // No consonants between vowels - split at vowel boundary
        splitPoint = nextVowelPos;
      } else if (consonantCluster.length === 1) {
        // Single consonant: check for special phonetic rules first
        splitPoint = this.applySingleConsonantRules(word, consonantStart, nextVowelPos, phonemes);
      } else {
        // Multiple consonants: apply cluster rules
        splitPoint = this.applyCVRules(consonantCluster, consonantStart, word);
      }

      // Extract syllable
      const syllable = word.slice(currentStart, splitPoint);
      if (syllable) {
        syllables.push(syllable);
      }
      currentStart = splitPoint;
    }

    // Add the final syllable
    const finalSyllable = word.slice(currentStart);
    if (finalSyllable) {
      syllables.push(finalSyllable);
    }

    // Adjust if we have too many or too few syllables
    return this.adjustSyllableCount(syllables, syllableCount);
  }

  private applySingleConsonantRules(word: string, consonantStart: number, nextVowelPos: number, phonemes: string[] = []): number {
    const consonant = word[consonantStart];
    const nextVowel = word[nextVowelPos];

    // Special rule: consonant + "y" (when y acts as vowel)
    // Consonants go to the left of y: "any" → "a-ny", "many" → "ma-ny", "very" → "ve-ry"
    if (nextVowel.toLowerCase() === 'y' && nextVowelPos === word.length - 1) {
      // Split before the consonant, so consonant goes with the y
      return consonantStart;
    }

    // Special rule: "c" + "i/e/y" stays together only at word boundaries or after vowels
    // This prevents breaking up words like "center" which should be "cen-ter" not "ce-nter"
    if (consonant.toLowerCase() === 'c' && 'iey'.includes(nextVowel.toLowerCase())) {
      // Only apply if c is at beginning of word or after a vowel
      if (consonantStart === 0 || 'aeiouAEIOU'.includes(word[consonantStart - 1])) {
        // Move consonant to the left with the vowel (split after the vowel)
        return nextVowelPos + 1;
      }
    }

    // Special rule: "g" + "i/e/y" stays together only if g makes /j/ sound
    if (consonant.toLowerCase() === 'g' && 'iey'.includes(nextVowel.toLowerCase())) {
      if (this.doesGMakeJSound(word, consonantStart, phonemes)) {
        // Only apply if g is at beginning of word or after a vowel
        if (consonantStart === 0 || 'aeiouAEIOU'.includes(word[consonantStart - 1])) {
          // Move consonant to the left with the vowel (split after the vowel)
          return nextVowelPos + 1;
        }
      }
    }

    // Default: split before consonant to create open syllable
    return consonantStart;
  }

  private doesGMakeJSound(word: string, gPosition: number, phonemes: string[]): boolean {
    // If no phonemes provided, can't determine sound
    if (phonemes.length === 0) {
      return false;
    }

    // Look for JH phoneme (which represents /j/ sound) in the phonemes
    // The position mapping is approximate since phonemes don't directly map to letter positions
    const hasJHPhoneme = phonemes.some(p => p.replace(/[0-2]$/, '') === 'JH');

    // If word contains JH phoneme and has g+i/e/y pattern, likely the g makes /j/ sound
    if (hasJHPhoneme && gPosition < word.length - 1) {
      const nextChar = word[gPosition + 1].toLowerCase();
      return 'iey'.includes(nextChar);
    }

    return false;
  }

  private applyCVRules(consonantCluster: string, consonantStart: number, word: string): number {
    // PRIORITY 0: Check for consonant + "y" at end of word (y acts as vowel)
    // Consonants go with the y: "any" → "a-ny", "many" → "ma-ny", "very" → "ve-ry"
    if (consonantCluster.length === 1 && consonantStart + 1 < word.length && 
        word[consonantStart + 1].toLowerCase() === 'y' && consonantStart + 2 === word.length) {
      // Keep consonant with y - split before the consonant
      return consonantStart;
    }

    // PRIORITY 0.5: Check for vowel+ng patterns that should stay together
    // Look for patterns like "ing", "ang", "ong", "ung", "eng" that should be kept as complete syllables
    if (consonantCluster.includes('ng')) {
      const ngPos = consonantCluster.indexOf('ng');
      // Check if there's a vowel before the 'ng' that forms a protected pattern
      const beforeNgInWord = consonantStart + ngPos - 1;
      if (beforeNgInWord >= 0) {
        const vowelChar = word[beforeNgInWord].toLowerCase();
        const pattern = vowelChar + 'ng';
        if (this.VOWEL_NG_PATTERNS.has(pattern)) {
          // Find the start of this vowel+ng pattern (could be multiple letters before 'ng')
          let patternStart = beforeNgInWord;

          // For "ing" pattern, we want to keep the entire "ing" together
          if (pattern === 'ing' && beforeNgInWord >= 1 && word[beforeNgInWord - 1].toLowerCase() === 'i') {
            patternStart = beforeNgInWord - 1;
          }

          // Keep the entire vowel+ng pattern together as one syllable
          // Split before the pattern starts
          return patternStart;
        }
      }
    }

    // PRIORITY 1: Check for consonant combinations that should be preserved (like ng, nk, etc.)
    // This MUST come FIRST before any other rules
    if (consonantCluster.length >= 2) {
      for (let i = 0; i < consonantCluster.length - 1; i++) {
        const combo = consonantCluster.slice(i, i + 2).toLowerCase();
        if (this.CONSONANT_CLUSTERS_TO_PRESERVE.has(combo)) {
          // Keep this combination together - split before it
          return consonantStart + i;
        }
      }
    }

    // Check for special phonetic rules (c + i/e/y pattern)
    if (consonantCluster.length >= 2 && consonantCluster[0].toLowerCase() === 'c') {
      // Look ahead to see if there's a vowel after this cluster that would trigger c+i/e/y rule
      // This is handled elsewhere, so continue with normal cluster rules
    }

    // PRIORITY 1.5: Root word preservation rule
    // If the syllable being formed is NOT a root word, follow normal consonant-to-left rules
    // BUT only for single consonants - let cluster preservation rules handle multiple consonants
    if (word && consonantCluster.length === 1) {
      // Find the start of the current syllable to check if it's a root word
      const syllableStart = this.findSyllableStart(word, consonantStart);
      const currentSyllable = word.slice(syllableStart, consonantStart).toLowerCase();

      // If the current syllable is NOT a root word, move consonant to the left
      if (currentSyllable.length > 0 && !this.COMMON_ROOT_WORDS.has(currentSyllable)) {
        // Move single consonant left (split after it)
        return consonantStart + 1;
      }

      // If it IS a root word, preserve it by continuing to other rules
    }

    // PRIORITY 2: Check if cluster CANNOT begin a word (split it)
    if (this.NEVER_INITIAL_CLUSTERS.has(consonantCluster.toLowerCase())) {
      // Split after first consonant since this cluster cannot start a word
      return consonantStart + 1;
    }

    // PRIORITY 3: Check if cluster can begin a word (only if no preserve rules applied)
    if (this.WORD_INITIAL_CLUSTERS.has(consonantCluster.toLowerCase())) {
      // Keep entire cluster together - split before it to create open syllable
      return consonantStart;
    }

    // PRIORITY 4: Check if suffix of cluster can begin a word or should be preserved
    for (let i = 1; i < consonantCluster.length; i++) {
      const suffix = consonantCluster.slice(i).toLowerCase();

      // First check if any part of this suffix should be preserved
      if (suffix.length >= 2) {
        for (let j = 0; j < suffix.length - 1; j++) {
          const combo = suffix.slice(j, j + 2).toLowerCase();
          if (this.CONSONANT_CLUSTERS_TO_PRESERVE.has(combo)) {
            // Split before the preserved combination
            return consonantStart + i + j;
          }
        }
      }

      // Then check if suffix can start a word
      if (this.WORD_INITIAL_CLUSTERS.has(suffix)) {
        // Split before the valid cluster to create open syllable
        return consonantStart + i;
      }
    }

    // No valid cluster found - prefer open syllables
    // For single consonant: split before it (creates open syllable)
    // For multiple consonants: split after first consonant (creates open syllable)
    if (consonantCluster.length === 1) {
      return consonantStart; // Split before single consonant
    } else {
      return consonantStart + 1; // Split after first consonant to create open syllable
    }
  }

  private simpleSyllableSplit(word: string, targetCount: number): string[] {
    const syllables: string[] = [];
    const avgLength = Math.ceil(word.length / targetCount);

    for (let i = 0; i < targetCount; i++) {
      const start = i * avgLength;
      const end = i === targetCount - 1 ? word.length : (i + 1) * avgLength;
      const syllable = word.slice(start, end);
      if (syllable) {
        syllables.push(syllable);
      }
    }

    return syllables;
  }

  private adjustSyllableCount(syllables: string[], targetCount: number): string[] {
    if (syllables.length === targetCount) {
      return syllables;
    }

    if (syllables.length < targetCount) {
      // Need to split some syllables
      while (syllables.length < targetCount) {
        const longestIndex = syllables.reduce((maxIdx, current, idx, array) => 
          current.length > array[maxIdx].length ? idx : maxIdx, 0);

        const longest = syllables[longestIndex];
        if (longest.length <= 2) break; // Can't split further

        const midPoint = Math.floor(longest.length / 2);
        const firstPart = longest.slice(0, midPoint);
        const secondPart = longest.slice(midPoint);

        syllables[longestIndex] = firstPart;
        syllables.splice(longestIndex + 1, 0, secondPart);
      }
    } else {
      // Need to merge some syllables
      while (syllables.length > targetCount) {
        const shortestIndex = syllables.reduce((minIdx, current, idx, array) => 
          current.length < array[minIdx].length ? idx : minIdx, 0);

        if (shortestIndex === 0) {
          syllables[0] += syllables[1];
          syllables.splice(1, 1);
        } else {
          syllables[shortestIndex - 1] += syllables[shortestIndex];
          syllables.splice(shortestIndex, 1);
        }
      }
    }

    return syllables;
  }

  private findSyllableStart(word: string, consonantStart: number): number {
      // Go backwards from consonantStart until you find a vowel or the beginning of the word
      let i = consonantStart - 1;
      const vowels = 'aeiouAEIOU';
      while (i >= 0 && !vowels.includes(word[i])) {
          i--;
      }
      return i + 1; // Syllable starts after the last vowel (or at the beginning)
  }

  async breakWordIntoSyllables(word: string): Promise<string[]> {
    await this.initialize();

    // Clean the word from punctuation
    const cleanWord = word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");

    // Handle empty or very short words
    if (!cleanWord || cleanWord.length <= 2) {
      return [cleanWord];
    }

    // Check for morphological overrides first (these take precedence over dictionary)
    const morphOverride = this.MORPHOLOGICAL_OVERRIDES.get(cleanWord);
    if (morphOverride) {
      return morphOverride;
    }

    // Look up in CMU dictionary
    const syllables = this.dictionary.get(cleanWord);
    if (syllables) {
      return syllables;
    }

    // Fallback for words not in dictionary: use simple vowel-based splitting
    return this.fallbackSyllabification(cleanWord);
  }

  private fallbackSyllabification(word: string): string[] {
    // Check for common morphological patterns first
    const morphological = this.handleMorphologicalPatterns(word);
    if (morphological.length > 0) {
      return morphological;
    }

    // Simple fallback: split on vowel clusters
    const vowels = 'aeiouAEIOU';
    const syllables: string[] = [];
    let currentSyllable = '';

    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      currentSyllable += char;

      // If this is a vowel and the next character is a consonant (or end of word)
      if (vowels.includes(char)) {
        const nextChar = word[i + 1];
        if (!nextChar || !vowels.includes(nextChar)) {
          // Look ahead to see if we should split here
          const nextNextChar = word[i + 2];
          if (nextChar && nextNextChar && vowels.includes(nextNextChar)) {
            // Split before the next consonant
            syllables.push(currentSyllable);
            currentSyllable = '';
          }
        }
      }
    }

    // Add any remaining characters to the last syllable
    if (currentSyllable) {
      if (syllables.length > 0) {
        syllables[syllables.length - 1] += currentSyllable;
      } else {
        syllables.push(currentSyllable);
      }
    }

    return syllables.length > 0 ? syllables : [word];
  }

  private handleMorphologicalPatterns(word: string): string[] {
    // Handle -tional endings (like "national", "international")
    if (word.endsWith('tional') && word.length > 7) {
      const root = word.slice(0, -6);
      const rootSyllables = this.dictionary.get(root) || this.basicSyllableSplit(root);
      return [...rootSyllables, 'tion', 'al'];
    }

    // Handle -tion endings 
    if (word.endsWith('tion') && word.length > 4) {
      const root = word.slice(0, -4);
      const rootSyllables = this.dictionary.get(root) || this.basicSyllableSplit(root);
      return [...rootSyllables, 'tion'];
    }

    // Handle -sion endings
    if (word.endsWith('sion') && word.length > 4) {
      const root = word.slice(0, -4);
      const rootSyllables = this.dictionary.get(root) || this.basicSyllableSplit(root);
      return [...rootSyllables, 'sion'];
    }

    // Handle -al endings (like "national", "personal")
    if (word.endsWith('al') && word.length > 3) {
      const root = word.slice(0, -2);
      const rootSyllables = this.dictionary.get(root) || this.basicSyllableSplit(root);
      return [...rootSyllables, 'al'];
    }

    // Handle -ly endings (adverbs)
    if (word.endsWith('ly') && word.length > 3) {
      const root = word.slice(0, -2);
      const rootSyllables = this.dictionary.get(root) || this.basicSyllableSplit(root);
      return [...rootSyllables, 'ly'];
    }

    // Handle -ing endings
    if (word.endsWith('ing') && word.length > 4) {
      const root = word.slice(0, -3);
      const rootSyllables = this.dictionary.get(root) || this.basicSyllableSplit(root);
      return [...rootSyllables, 'ing'];
    }

    // Handle -ed endings (past tense)
    if (word.endsWith('ed') && word.length > 3) {
      const root = word.slice(0, -2);

      // Check if -ed creates a new syllable or not
      // -ed creates new syllable (/ɪd/ sound) only when preceded by 't' or 'd' sounds
      const lastChar = root.slice(-1).toLowerCase();

      // Check last character of root for 't' or 'd' sound
      if (lastChar === 't' || lastChar === 'd') {
        // -ed makes /ɪd/ sound and creates new syllable
        // BUT preserve root word structure (morphological rule trumps phonetic)
        return [root, 'ed'];
      } else {
        // -ed makes /t/ or /d/ sound and joins with previous syllable
        const rootSyllables = this.dictionary.get(root) || this.basicSyllableSplit(root);
        if (rootSyllables.length > 0) {
          const lastSyllable = rootSyllables[rootSyllables.length - 1];
          const modifiedSyllables = [...rootSyllables.slice(0, -1), lastSyllable + 'ed'];
          return modifiedSyllables;
        } else {
          return [root + 'ed'];
        }
      }
    }

    // Handle -er endings
    if (word.endsWith('er') && word.length > 3) {
      const root = word.slice(0, -2);
      const rootSyllables = this.dictionary.get(root) || this.basicSyllableSplit(root);
      return [...rootSyllables, 'er'];
    }

    // Handle -est endings
    if (word.endsWith('est') && word.length > 4) {
      const root = word.slice(0, -3);
      const rootSyllables = this.dictionary.get(root) || this.basicSyllableSplit(root);
      return [...rootSyllables, 'est'];
    }

    return [];
  }

  private basicSyllableSplit(word: string): string[] {
    // Simple vowel-based splitting without morphological pattern handling
    const vowels = 'aeiouAEIOU';
    const syllables: string[] = [];
    let currentSyllable = '';

    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      currentSyllable += char;

      // If this is a vowel and the next character is a consonant (or end of word)
      if (vowels.includes(char)) {
        const nextChar = word[i + 1];
        if (!nextChar || !vowels.includes(nextChar)) {
          // Look ahead to see if we should split here
          const nextNextChar = word[i + 2];
          if (nextChar && nextNextChar && vowels.includes(nextNextChar)) {
            // Split before the next consonant
            syllables.push(currentSyllable);
            currentSyllable = '';
          }
        }
      }
    }

    // Add any remaining characters to the last syllable
    if (currentSyllable) {
      if (syllables.length > 0) {
        syllables[syllables.length - 1] += currentSyllable;
      } else {
        syllables.push(currentSyllable);
      }
    }

    return syllables.length > 0 ? syllables : [word];
  }
}

// Global instance
const cmuSyllabifier = new CMUSyllabifier();

export async function breakWordIntoSyllables(word: string): Promise<string[]> {
  return cmuSyllabifier.breakWordIntoSyllables(word);
}