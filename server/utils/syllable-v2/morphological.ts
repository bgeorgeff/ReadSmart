
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

// Compound words that should be split at word boundaries
// Extended database from VB system (833 compound words)
export const COMPOUND_WORDS = new Map<string, string[]>([
  ['afterall', ['after', 'all']],
  ['afterlife', ['after', 'life']],
  ['aftermath', ['after', 'math']],
  ['afternoon', ['after', 'noon']],
  ['aftershave', ['after', 'shave']],
  ['aftershock', ['after', 'shock']],
  ['afterthought', ['after', 'thought']],
  ['afterward', ['after', 'ward']],
  ['afterwards', ['after', 'wards']],
  ['airborne', ['air', 'borne']],
  ['aircraft', ['air', 'craft']],
  ['airfield', ['air', 'field']],
  ['airline', ['air', 'line']],
  ['airplane', ['air', 'plane']],
  ['airport', ['air', 'port']],
  ['airship', ['air', 'ship']],
  ['airtight', ['air', 'tight']],
  ['airtime', ['air', 'time']],
  ['airway', ['air', 'way']],
  ['anywhere', ['any', 'where']],
  ['anybody', ['any', 'body']],
  ['anyhow', ['any', 'how']],
  ['anymore', ['any', 'more']],
  ['anyone', ['any', 'one']],
  ['anyplace', ['any', 'place']],
  ['anything', ['any', 'thing']],
  ['anytime', ['any', 'time']],
  ['anyway', ['any', 'way']],
  ['backbone', ['back', 'bone']],
  ['backdrop', ['back', 'drop']],
  ['background', ['back', 'ground']],
  ['backlog', ['back', 'log']],
  ['backpack', ['back', 'pack']],
  ['backside', ['back', 'side']],
  ['backstage', ['back', 'stage']],
  ['backup', ['back', 'up']],
  ['backward', ['back', 'ward']],
  ['backwards', ['back', 'wards']],
  ['backyard', ['back', 'yard']],
  ['baseball', ['base', 'ball']],
  ['basement', ['base', 'ment']],
  ['basketball', ['basket', 'ball']],
  ['bathroom', ['bath', 'room']],
  ['bathtub', ['bath', 'tub']],
  ['battlefield', ['battle', 'field']],
  ['battleground', ['battle', 'ground']],
  ['battleship', ['battle', 'ship']],
  ['bedroom', ['bed', 'room']],
  ['bedside', ['bed', 'side']],
  ['bedtime', ['bed', 'time']],
  ['birthday', ['birth', 'day']],
  ['birthmark', ['birth', 'mark']],
  ['birthplace', ['birth', 'place']],
  ['birthright', ['birth', 'right']],
  ['blackboard', ['black', 'board']],
  ['blackmail', ['black', 'mail']],
  ['blackout', ['black', 'out']],
  ['blueprint', ['blue', 'print']],
  ['boardwalk', ['board', 'walk']],
  ['bookcase', ['book', 'case']],
  ['bookmark', ['book', 'mark']],
  ['bookshelf', ['book', 'shelf']],
  ['bookstore', ['book', 'store']],
  ['brainstorm', ['brain', 'storm']],
  ['breakfast', ['break', 'fast']],
  ['breakthrough', ['break', 'through']],
  ['bridesmaid', ['brides', 'maid']],
  ['broadcast', ['broad', 'cast']],
  ['campfire', ['camp', 'fire']],
  ['campground', ['camp', 'ground']],
  ['campsite', ['camp', 'site']],
  ['cannot', ['can', 'not']],
  ['cardboard', ['card', 'board']],
  ['carefree', ['care', 'free']],
  ['caregiver', ['care', 'giver']],
  ['careless', ['care', 'less']],
  ['caretaker', ['care', 'taker']],
  ['carpool', ['car', 'pool']],
  ['carwash', ['car', 'wash']],
  ['classroom', ['class', 'room']],
  ['classmate', ['class', 'mate']],
  ['classwork', ['class', 'work']],
  ['clockwise', ['clock', 'wise']],
  ['clockwork', ['clock', 'work']],
  ['copyright', ['copy', 'right']],
  ['cornfield', ['corn', 'field']],
  ['courthouse', ['court', 'house']],
  ['courtroom', ['court', 'room']],
  ['courtyard', ['court', 'yard']],
  ['crosswalk', ['cross', 'walk']],
  ['crossword', ['cross', 'word']],
  ['daybreak', ['day', 'break']],
  ['daydream', ['day', 'dream']],
  ['daylight', ['day', 'light']],
  ['daytime', ['day', 'time']],
  ['deadline', ['dead', 'line']],
  ['doorbell', ['door', 'bell']],
  ['doorknob', ['door', 'knob']],
  ['doorstep', ['door', 'step']],
  ['doorway', ['door', 'way']],
  ['downtown', ['down', 'town']],
  ['downstairs', ['down', 'stairs']],
  ['downward', ['down', 'ward']],
  ['earthquake', ['earth', 'quake']],
  ['earring', ['ear', 'ring']],
  ['everything', ['every', 'thing']],
  ['everybody', ['every', 'body']],
  ['everyday', ['every', 'day']],
  ['everyone', ['every', 'one']],
  ['everywhere', ['every', 'where']],
  ['eyeball', ['eye', 'ball']],
  ['eyebrow', ['eye', 'brow']],
  ['eyelash', ['eye', 'lash']],
  ['eyelid', ['eye', 'lid']],
  ['eyesight', ['eye', 'sight']],
  ['fairway', ['fair', 'way']],
  ['farewell', ['fare', 'well']],
  ['farmhouse', ['farm', 'house']],
  ['farmland', ['farm', 'land']],
  ['farmyard', ['farm', 'yard']],
  ['fingerprint', ['finger', 'print']],
  ['fingertip', ['finger', 'tip']],
  ['firearm', ['fire', 'arm']],
  ['fireball', ['fire', 'ball']],
  ['firecracker', ['fire', 'cracker']],
  ['firefighter', ['fire', 'fighter']],
  ['firefly', ['fire', 'fly']],
  ['firehouse', ['fire', 'house']],
  ['fireman', ['fire', 'man']],
  ['fireplace', ['fire', 'place']],
  ['fireproof', ['fire', 'proof']],
  ['fireside', ['fire', 'side']],
  ['firewood', ['fire', 'wood']],
  ['firework', ['fire', 'work']],
  ['first-aid', ['first', 'aid']],
  ['firsthand', ['first', 'hand']],
  ['fisherman', ['fisher', 'man']],
  ['flagpole', ['flag', 'pole']],
  ['flashlight', ['flash', 'light']],
  ['football', ['foot', 'ball']],
  ['footpath', ['foot', 'path']],
  ['footprint', ['foot', 'print']],
  ['footstep', ['foot', 'step']],
  ['forearm', ['fore', 'arm']],
  ['forecast', ['fore', 'cast']],
  ['forehead', ['fore', 'head']],
  ['foreign', ['for', 'eign']],
  ['foremost', ['fore', 'most']],
  ['foresight', ['fore', 'sight']],
  ['forever', ['for', 'ever']],
  ['forgetful', ['forget', 'ful']],
  ['freeway', ['free', 'way']],
  ['friendship', ['friend', 'ship']],
  ['gentleman', ['gentle', 'man']],
  ['girlfriend', ['girl', 'friend']],
  ['goldfish', ['gold', 'fish']],
  ['goodbye', ['good', 'bye']],
  ['grandchild', ['grand', 'child']],
  ['granddaughter', ['grand', 'daughter']],
  ['grandfather', ['grand', 'father']],
  ['grandmother', ['grand', 'mother']],
  ['grandparent', ['grand', 'parent']],
  ['grandson', ['grand', 'son']],
  ['grapefruit', ['grape', 'fruit']],
  ['grasshopper', ['grass', 'hopper']],
  ['greenhouse', ['green', 'house']],
  ['grownup', ['grown', 'up']],
  ['hairbrush', ['hair', 'brush']],
  ['haircut', ['hair', 'cut']],
  ['hairline', ['hair', 'line']],
  ['halfway', ['half', 'way']],
  ['handbook', ['hand', 'book']],
  ['handmade', ['hand', 'made']],
  ['handout', ['hand', 'out']],
  ['handshake', ['hand', 'shake']],
  ['handwriting', ['hand', 'writing']],
  ['hardcover', ['hard', 'cover']],
  ['hardware', ['hard', 'ware']],
  ['headache', ['head', 'ache']],
  ['headband', ['head', 'band']],
  ['headline', ['head', 'line']],
  ['headlight', ['head', 'light']],
  ['headphones', ['head', 'phones']],
  ['headquarters', ['head', 'quarters']],
  ['headway', ['head', 'way']],
  ['heartbeat', ['heart', 'beat']],
  ['heartbreak', ['heart', 'break']],
  ['herself', ['her', 'self']],
  ['highway', ['high', 'way']],
  ['hilltop', ['hill', 'top']],
  ['himself', ['him', 'self']],
  ['homework', ['home', 'work']],
  ['homemade', ['home', 'made']],
  ['hometown', ['home', 'town']],
  ['horseback', ['horse', 'back']],
  ['houseboat', ['house', 'boat']],
  ['household', ['house', 'hold']],
  ['housekeeper', ['house', 'keeper']],
  ['housework', ['house', 'work']],
  ['however', ['how', 'ever']],
  ['inside', ['in', 'side']],
  ['into', ['in', 'to']],
  ['itself', ['it', 'self']],
  ['jailbird', ['jail', 'bird']],
  ['jellyfish', ['jelly', 'fish']],
  ['keyboard', ['key', 'board']],
  ['keyhole', ['key', 'hole']],
  ['landmark', ['land', 'mark']],
  ['landscape', ['land', 'scape']],
  ['laptop', ['lap', 'top']],
  ['laundromat', ['laundro', 'mat']],
  ['lawsuit', ['law', 'suit']],
  ['lifeboat', ['life', 'boat']],
  ['lifestyle', ['life', 'style']],
  ['lifetime', ['life', 'time']],
  ['lighthouse', ['light', 'house']],
  ['likewise', ['like', 'wise']],
  ['lipstick', ['lip', 'stick']],
  ['lunchtime', ['lunch', 'time']],
  ['mailbox', ['mail', 'box']],
  ['mailman', ['mail', 'man']],
  ['marketplace', ['market', 'place']],
  ['masterpiece', ['master', 'piece']],
  ['meanwhile', ['mean', 'while']],
  ['motorcycle', ['motor', 'cycle']],
  ['moviegoer', ['movie', 'goer']],
  ['myself', ['my', 'self']],
  ['nearby', ['near', 'by']],
  ['necktie', ['neck', 'tie']],
  ['neighborhood', ['neighbor', 'hood']],
  ['newborn', ['new', 'born']],
  ['newspaper', ['news', 'paper']],
  ['newsstand', ['news', 'stand']],
  ['nightclub', ['night', 'club']],
  ['nightmare', ['night', 'mare']],
  ['nighttime', ['night', 'time']],
  ['nobody', ['no', 'body']],
  ['nonfiction', ['non', 'fiction']],
  ['nonetheless', ['none', 'the', 'less']],
  ['nonsense', ['non', 'sense']],
  ['nonstop', ['non', 'stop']],
  ['noontime', ['noon', 'time']],
  ['northeast', ['north', 'east']],
  ['northern', ['north', 'ern']],
  ['northwest', ['north', 'west']],
  ['nothing', ['no', 'thing']],
  ['notebook', ['note', 'book']],
  ['notepad', ['note', 'pad']],
  ['nowhere', ['no', 'where']],
  ['oatmeal', ['oat', 'meal']],
  ['offshore', ['off', 'shore']],
  ['online', ['on', 'line']],
  ['onto', ['on', 'to']],
  ['otherwise', ['other', 'wise']],
  ['ourself', ['our', 'self']],
  ['ourselves', ['our', 'selves']],
  ['outdoor', ['out', 'door']],
  ['outgoing', ['out', 'going']],
  ['outline', ['out', 'line']],
  ['outlook', ['out', 'look']],
  ['output', ['out', 'put']],
  ['outreach', ['out', 'reach']],
  ['outside', ['out', 'side']],
  ['outward', ['out', 'ward']],
  ['overflow', ['over', 'flow']],
  ['overlook', ['over', 'look']],
  ['overnight', ['over', 'night']],
  ['overseas', ['over', 'seas']],
  ['overturn', ['over', 'turn']],
  ['paperback', ['paper', 'back']],
  ['paperwork', ['paper', 'work']],
  ['passport', ['pass', 'port']],
  ['password', ['pass', 'word']],
  ['pathway', ['path', 'way']],
  ['paycheck', ['pay', 'check']],
  ['payroll', ['pay', 'roll']],
  ['peanut', ['pea', 'nut']],
  ['pineapple', ['pine', 'apple']],
  ['playground', ['play', 'ground']],
  ['playmate', ['play', 'mate']],
  ['postcard', ['post', 'card']],
  ['postmark', ['post', 'mark']],
  ['postmaster', ['post', 'master']],
  ['postpone', ['post', 'pone']],
  ['railroad', ['rail', 'road']],
  ['railway', ['rail', 'way']],
  ['rainbow', ['rain', 'bow']],
  ['raincoat', ['rain', 'coat']],
  ['raindrop', ['rain', 'drop']],
  ['rainfall', ['rain', 'fall']],
  ['rainwater', ['rain', 'water']],
  ['ringside', ['ring', 'side']],
  ['riverside', ['river', 'side']],
  ['roadside', ['road', 'side']],
  ['roadway', ['road', 'way']],
  ['rooftop', ['roof', 'top']],
  ['roommate', ['room', 'mate']],
  ['rosebud', ['rose', 'bud']],
  ['salesperson', ['sales', 'person']],
  ['saleswoman', ['sales', 'woman']],
  ['sawdust', ['saw', 'dust']],
  ['schoolbook', ['school', 'book']],
  ['schoolboy', ['school', 'boy']],
  ['schoolgirl', ['school', 'girl']],
  ['schoolhouse', ['school', 'house']],
  ['schoolmate', ['school', 'mate']],
  ['schoolroom', ['school', 'room']],
  ['schoolwork', ['school', 'work']],
  ['schoolyard', ['school', 'yard']],
  ['seashore', ['sea', 'shore']],
  ['seaside', ['sea', 'side']],
  ['seaweed', ['sea', 'weed']],
  ['seawater', ['sea', 'water']],
  ['selfie', ['self', 'ie']],
  ['shellfish', ['shell', 'fish']],
  ['shipyard', ['ship', 'yard']],
  ['shoelace', ['shoe', 'lace']],
  ['shortcut', ['short', 'cut']],
  ['showcase', ['show', 'case']],
  ['sidewalk', ['side', 'walk']],
  ['skateboard', ['skate', 'board']],
  ['snowball', ['snow', 'ball']],
  ['snowboard', ['snow', 'board']],
  ['snowfall', ['snow', 'fall']],
  ['snowflake', ['snow', 'flake']],
  ['snowman', ['snow', 'man']],
  ['snowplow', ['snow', 'plow']],
  ['snowstorm', ['snow', 'storm']],
  ['softball', ['soft', 'ball']],
  ['software', ['soft', 'ware']],
  ['somebody', ['some', 'body']],
  ['someday', ['some', 'day']],
  ['somehow', ['some', 'how']],
  ['someone', ['some', 'one']],
  ['someplace', ['some', 'place']],
  ['something', ['some', 'thing']],
  ['sometime', ['some', 'time']],
  ['sometimes', ['some', 'times']],
  ['somewhat', ['some', 'what']],
  ['somewhere', ['some', 'where']],
  ['southeast', ['south', 'east']],
  ['southern', ['south', 'ern']],
  ['southwest', ['south', 'west']],
  ['spaceship', ['space', 'ship']],
  ['starfish', ['star', 'fish']],
  ['starlight', ['star', 'light']],
  ['steamboat', ['steam', 'boat']],
  ['stepfather', ['step', 'father']],
  ['stepmother', ['step', 'mother']],
  ['storeroom', ['store', 'room']],
  ['strawberry', ['straw', 'berry']],
  ['streetcar', ['street', 'car']],
  ['streetlight', ['street', 'light']],
  ['suitcase', ['suit', 'case']],
  ['sunburn', ['sun', 'burn']],
  ['sunflower', ['sun', 'flower']],
  ['sunglasses', ['sun', 'glasses']],
  ['sunlight', ['sun', 'light']],
  ['sunrise', ['sun', 'rise']],
  ['sunset', ['sun', 'set']],
  ['sunshine', ['sun', 'shine']],
  ['supermarket', ['super', 'market']],
  ['tablespoon', ['table', 'spoon']],
  ['teacup', ['tea', 'cup']],
  ['teammate', ['team', 'mate']],
  ['teamwork', ['team', 'work']],
  ['teaspoon', ['tea', 'spoon']],
  ['textbook', ['text', 'book']],
  ['themselves', ['them', 'selves']],
  ['therefore', ['there', 'fore']],
  ['throughout', ['through', 'out']],
  ['thunderstorm', ['thunder', 'storm']],
  ['today', ['to', 'day']],
  ['together', ['to', 'gether']],
  ['toilet', ['toi', 'let']],
  ['tomorrow', ['to', 'morrow']],
  ['tonight', ['to', 'night']],
  ['toothbrush', ['tooth', 'brush']],
  ['toothpaste', ['tooth', 'paste']],
  ['touchdown', ['touch', 'down']],
  ['treadmill', ['tread', 'mill']],
  ['typewriter', ['type', 'writer']],
  ['undercover', ['under', 'cover']],
  ['undergo', ['under', 'go']],
  ['underground', ['under', 'ground']],
  ['underline', ['under', 'line']],
  ['understand', ['under', 'stand']],
  ['underwater', ['under', 'water']],
  ['underwear', ['under', 'wear']],
  ['uphill', ['up', 'hill']],
  ['upon', ['up', 'on']],
  ['upright', ['up', 'right']],
  ['upside', ['up', 'side']],
  ['upstairs', ['up', 'stairs']],
  ['uptown', ['up', 'town']],
  ['upward', ['up', 'ward']],
  ['viewpoint', ['view', 'point']],
  ['volleyball', ['volley', 'ball']],
  ['walkway', ['walk', 'way']],
  ['wallpaper', ['wall', 'paper']],
  ['warehouse', ['ware', 'house']],
  ['washcloth', ['wash', 'cloth']],
  ['wastebasket', ['waste', 'basket']],
  ['waterfall', ['water', 'fall']],
  ['watermelon', ['water', 'melon']],
  ['waterproof', ['water', 'proof']],
  ['waterway', ['water', 'way']],
  ['weekend', ['week', 'end']],
  ['weekday', ['week', 'day']],
  ['welcome', ['wel', 'come']],
  ['welfare', ['wel', 'fare']],
  ['whatever', ['what', 'ever']],
  ['whenever', ['when', 'ever']],
  ['whereas', ['where', 'as']],
  ['whereby', ['where', 'by']],
  ['wherever', ['where', 'ever']],
  ['widespread', ['wide', 'spread']],
  ['wildlife', ['wild', 'life']],
  ['windmill', ['wind', 'mill']],
  ['window', ['win', 'dow']],
  ['windshield', ['wind', 'shield']],
  ['within', ['with', 'in']],
  ['without', ['with', 'out']],
  ['wonderful', ['wonder', 'ful']],
  ['woodland', ['wood', 'land']],
  ['woodwork', ['wood', 'work']],
  ['workbook', ['work', 'book']],
  ['workout', ['work', 'out']],
  ['workplace', ['work', 'place']],
  ['workshop', ['work', 'shop']],
  ['worldwide', ['world', 'wide']],
  ['worthwhile', ['worth', 'while']],
  ['yourself', ['your', 'self']],
  ['yourselves', ['your', 'selves']]
]);

// Morphological overrides for special cases
const MORPHOLOGICAL_OVERRIDES = new Map([
  // Silent-e words that need special handling
  ['simile', 'si-mi-le'],
  ['hyperbole', 'hy-per-bo-le'],
  ['epitome', 'e-pit-o-me'],
  ['anemone', 'a-nem-o-ne'],
  ['acme', 'ac-me'],
  ['adobe', 'a-do-be'],
  ['apache', 'a-pa-che'],
  ['apostrophe', 'a-pos-tro-phe'],
  ['biopsy', 'bi-op-sy'],
  ['breathe', 'breathe'],
  ['catastrophe', 'ca-tas-tro-phe'],
  ['chile', 'chi-le'],
  ['cliche', 'cli-che'],
  ['come', 'come'],
  ['coyote', 'coy-o-te'],
  ['facade', 'fa-cade'],
  ['forte', 'for-te'],
  ['give', 'give'],
  ['yone', 'y-one'],
  ['genie', 'ge-nie'],
  ['gone', 'gone'],
  ['have', 'have'],
  ['karate', 'ka-ra-te'],
  ['live', 'live'],
  ['love', 'love'],
  ['move', 'move'],
  ['movie', 'mo-vie'],
  ['nike', 'ni-ke'],
  ['none', 'none'],
  ['one', 'one'],
  ['recipe', 'rec-i-pe'],
  ['some', 'some'],
  ['tie', 'tie']
]);

export class MorphologicalAnalyzer {
  /**
   * Check if word has morphological override
   */
  getMorphologicalOverride(word: string): string | null {
    const normalized = word.toLowerCase();
    return MORPHOLOGICAL_OVERRIDES.get(normalized) || null;
  }

  /**
   * Get compound components for a word
   */
  getCompoundComponents(word: string): string[] | null {
    const normalized = word.toLowerCase();
    return COMPOUND_WORDS.get(normalized) || null;
  }

  /**
   * Handle -ed suffix with phonetic rules
   */
  handleEdSuffix(word: string): string[] | null {
    if (!word.endsWith('ed')) return null;
    
    const root = word.slice(0, -2);
    if (root.length < 2) return null;
    
    const lastChar = root.slice(-1).toLowerCase();
    
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
