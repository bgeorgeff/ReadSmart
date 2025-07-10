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
  // After- compounds
  ['afterall', ['after', 'all']],
  ['afterlife', ['after', 'life']],
  ['aftermath', ['after', 'math']],
  ['afternoon', ['after', 'noon']],
  ['aftershave', ['after', 'shave']],
  ['afterthought', ['after', 'thought']],
  ['afterward', ['after', 'ward']],
  
  // Air- compounds
  ['airbag', ['air', 'bag']],
  ['airboat', ['air', 'boat']],
  ['airhole', ['air', 'hole']],
  ['airmattress', ['air', 'mattress']],
  ['aircraft', ['air', 'craft']],
  ['airfield', ['air', 'field']],
  ['airmail', ['air', 'mail']],
  ['airman', ['air', 'man']],
  ['airplane', ['air', 'plane']],
  ['airport', ['air', 'port']],
  ['airsick', ['air', 'sick']],
  ['airtight', ['air', 'tight']],
  
  // Ant- compounds
  ['anteater', ['ant', 'eater']],
  ['anthill', ['ant', 'hill']],
  
  // Any- compounds
  ['anybody', ['any', 'body']],
  ['anyhow', ['any', 'how']],
  ['anyone', ['any', 'one']],
  ['anyplace', ['any', 'place']],
  ['anything', ['any', 'thing']],
  ['anytime', ['any', 'time']],
  ['anyway', ['any', 'way']],
  ['anywhere', ['any', 'where']],
  
  // Apple compounds
  ['applesauce', ['apple', 'sauce']],
  
  // Arm- compounds
  ['armchair', ['arm', 'chair']],
  ['armpit', ['arm', 'pit']],
  ['armrest', ['arm', 'rest']],
  
  // Arrow- compounds
  ['arrowhead', ['arrow', 'head']],
  
  // Baby- compounds
  ['babyhood', ['baby', 'hood']],
  
  // Back- compounds
  ['backaway', ['back', 'away']],
  ['backroom', ['back', 'room']],
  ['backache', ['back', 'ache']],
  ['backbiting', ['back', 'biting']],
  ['backboard', ['back', 'board']],
  ['backbone', ['back', 'bone']],
  ['backbreaking', ['back', 'breaking']],
  ['backdoor', ['back', 'door']],
  ['backdrop', ['back', 'drop']],
  ['backfield', ['back', 'field']],
  ['backfire', ['back', 'fire']],
  ['background', ['back', 'ground']],
  ['backhand', ['back', 'hand']],
  ['backlash', ['back', 'lash']],
  ['backlog', ['back', 'log']],
  ['backpack', ['back', 'pack']],
  ['backseat', ['back', 'seat']],
  ['backspin', ['back', 'spin']],
  ['backstab', ['back', 'stab']],
  ['backstage', ['back', 'stage']],
  ['backstop', ['back', 'stop']],
  ['backstroke', ['back', 'stroke']],
  ['backward', ['back', 'ward']],
  ['backyard', ['back', 'yard']],
  
  // Bag- compounds
  ['bagpipe', ['bag', 'pipe']],
  
  // Ball- compounds
  ['ballgame', ['ball', 'game']],
  ['ballpark', ['ball', 'park']],
  ['ballplayer', ['ball', 'player']],
  
  // Band- compounds
  ['bandleader', ['band', 'leader']],
  ['bandwagon', ['band', 'wagon']],
  ['bandwidth', ['band', 'width']],
  
  // Bare- compounds
  ['barefoot', ['bare', 'foot']],
  
  // Barn- compounds
  ['barnyard', ['barn', 'yard']],
  
  // Base- compounds
  ['baseball', ['base', 'ball']],
  
  // Basket- compounds
  ['basketball', ['basket', 'ball']],
  
  // Bath- compounds
  ['bathmat', ['bath', 'mat']],
  ['bathrobe', ['bath', 'robe']],
  ['bathroom', ['bath', 'room']],
  ['bathtub', ['bath', 'tub']],
  ['bathwater', ['bath', 'water']],
  
  // Battle- compounds
  ['battlefield', ['battle', 'field']],
  ['battlefront', ['battle', 'front']],
  ['battleground', ['battle', 'ground']],
  
  // Bean- compounds
  ['beanbag', ['bean', 'bag']],
  ['beanpod', ['bean', 'pod']],
  ['beanpole', ['bean', 'pole']],
  
  // Bed- compounds
  ['bedrest', ['bed', 'rest']],
  ['bedclothes', ['bed', 'clothes']],
  ['bedpost', ['bed', 'post']],
  ['bedridden', ['bed', 'ridden']],
  ['bedrock', ['bed', 'rock']],
  ['bedroll', ['bed', 'roll']],
  ['bedroom', ['bed', 'room']],
  ['bedside', ['bed', 'side']],
  ['bedspread', ['bed', 'spread']],
  ['bedspring', ['bed', 'spring']],
  ['bedtime', ['bed', 'time']],
  
  // Bee- compounds
  ['beehive', ['bee', 'hive']],
  ['beeline', ['bee', 'line']],
  
  // Before- compounds
  ['beforehand', ['before', 'hand']],
  
  // Bench- compounds
  ['benchmark', ['bench', 'mark']],
  
  // Big- compounds
  ['bigmouth', ['big', 'mouth']],
  
  // Bill- compounds
  ['billfold', ['bill', 'fold']],
  
  // Bird- compounds
  ['birddog', ['bird', 'dog']],
  ['birdbath', ['bird', 'bath']],
  ['birdcage', ['bird', 'cage']],
  ['birdcall', ['bird', 'call']],
  ['birdhouse', ['bird', 'house']],
  ['birdseed', ['bird', 'seed']],
  
  // Birth- compounds
  ['birthday', ['birth', 'day']],
  ['birthmark', ['birth', 'mark']],
  
  // Black- compounds
  ['blackbird', ['black', 'bird']],
  ['blackboard', ['black', 'board']],
  ['blacklist', ['black', 'list']],
  ['blackmail', ['black', 'mail']],
  ['blacktop', ['black', 'top']],
  
  // Blind- compounds
  ['blindfold', ['blind', 'fold']],
  
  // Block- compounds
  ['blockbuster', ['block', 'buster']],
  
  // Blow- compounds
  ['blowout', ['blow', 'out']],
  
  // Blue- compounds
  ['blueberry', ['blue', 'berry']],
  ['bluebird', ['blue', 'bird']],
  ['blueprint', ['blue', 'print']],
  
  // Boat- compounds
  ['boathouse', ['boat', 'house']],
  
  // Body- compounds
  ['bodyguard', ['body', 'guard']],
  
  // Book- compounds
  ['bookbag', ['book', 'bag']],
  ['bookcase', ['book', 'case']],
  ['bookmark', ['book', 'mark']],
  
  // Border- compounds
  ['borderline', ['border', 'line']],
  
  // Bother- compounds
  ['bothersome', ['bother', 'some']],
  
  // Bottle- compounds
  ['bottleneck', ['bottle', 'neck']],
  ['bottonhole', ['button', 'hole']],
  
  // Boy- compounds
  ['boyfriend', ['boy', 'friend']],
  
  // Brain- compounds
  ['brainstorm', ['brain', 'storm']],
  ['brainwash', ['brain', 'wash']],
  
  // Bread- compounds
  ['breadbox', ['bread', 'box']],
  ['breadwinner', ['bread', 'winner']],
  
  // Break- compounds
  ['breakdown', ['break', 'down']],
  ['breakfast', ['break', 'fast']],
  ['breakout', ['break', 'out']],
  ['breakthrough', ['break', 'through']],
  
  // Brick- compounds
  ['bricklayer', ['brick', 'layer']],
  
  // Broad- compounds
  ['broadcast', ['broad', 'cast']],
  
  // Broom- compounds
  ['broomstick', ['broom', 'stick']],
  
  // Bull- compounds
  ['bulldog', ['bull', 'dog']],
  ['bullfight', ['bull', 'fight']],
  ['bullfrog', ['bull', 'frog']],
  
  // Bunk- compounds
  ['bunkhouse', ['bunk', 'house']],
  
  // Butter- compounds
  ['butterfly', ['butter', 'fly']],
  ['buttermilk', ['butter', 'milk']],
  
  // By- compounds
  ['bypass', ['by', 'pass']],
  
  // Camp- compounds
  ['campfire', ['camp', 'fire']],
  ['campground', ['camp', 'ground']],
  
  // Candle- compounds
  ['candlelight', ['candle', 'light']],
  ['candlemaker', ['candle', 'maker']],
  ['candlestick', ['candle', 'stick']],
  
  // Card- compounds
  ['cardboard', ['card', 'board']],
  
  // Care- compounds
  ['carefree', ['care', 'free']],
  ['caregiver', ['care', 'giver']],
  ['careless', ['care', 'less']],
  ['caretaker', ['care', 'taker']],
  
  // Catch- compounds
  ['catchword', ['catch', 'word']],
  
  // Chair- compounds
  ['chairperson', ['chair', 'person']],
  
  // Chalk- compounds
  ['chalkboard', ['chalk', 'board']],
  
  // Cheer- compounds
  ['cheerleader', ['cheer', 'leader']],
  
  // Class- compounds
  ['classmate', ['class', 'mate']],
  ['classroom', ['class', 'room']],
  
  // Clergy- compounds
  ['clergyperson', ['clergy', 'person']],
  
  // Close- compounds
  ['closemouthed', ['close', 'mouthed']],
  
  // Clothes- compounds
  ['clothespin', ['clothes', 'pin']],
  
  // Club- compounds
  ['clubhouse', ['club', 'house']],
  
  // Coal- compounds
  ['coalmine', ['coal', 'mine']],
  
  // Collar- compounds
  ['collarbone', ['collar', 'bone']],
  
  // Common- compounds
  ['commonplace', ['common', 'place']],
  ['commonwealth', ['common', 'wealth']],
  
  // Cook- compounds
  ['cookbook', ['cook', 'book']],
  
  // Copy- compounds
  ['copyright', ['copy', 'right']],
  
  // Corn- compounds
  ['cornbread', ['corn', 'bread']],
  ['corncob', ['corn', 'cob']],
  ['cornfield', ['corn', 'field']],
  
  // Count- compounds
  ['countdown', ['count', 'down']],
  
  // Counter- compounds
  ['counteract', ['counter', 'act']],
  ['counterbalance', ['counter', 'balance']],
  ['counterpart', ['counter', 'part']],
  
  // Country- compounds
  ['countryside', ['country', 'side']],
  
  // Cow- compounds
  ['cowboy', ['cow', 'boy']],
  
  // Crafts- compounds
  ['craftsperson', ['crafts', 'person']],
  
  // Cross- compounds
  ['crossways', ['cross', 'ways']],
  ['crossword', ['cross', 'word']],
  ['crosswind', ['cross', 'wind']],
  
  // Cup- compounds
  ['cupcake', ['cup', 'cake']],
  
  // Cut- compounds
  ['cutback', ['cut', 'back']],
  ['cutthroat', ['cut', 'throat']],
  
  // Cyber- compounds
  ['cyberpunk', ['cyber', 'punk']],
  ['cyperspace', ['cyber', 'space']],
  
  // Dash- compounds
  ['dashboard', ['dash', 'board']],
  
  // Day- compounds
  ['daybook', ['day', 'book']],
  ['daybreak', ['day', 'break']],
  ['daycare', ['day', 'care']],
  ['daydream', ['day', 'dream']],
  ['daylight', ['day', 'light']],
  
  // Dead- compounds
  ['deadline', ['dead', 'line']],
  ['deadlock', ['dead', 'lock']],
  ['deadpan', ['dead', 'pan']],
  
  // Die- compounds
  ['diehard', ['die', 'hard']],
  
  // Dish- compounds
  ['dishcloth', ['dish', 'cloth']],
  ['dishpan', ['dish', 'pan']],
  
  // Diving- compounds
  ['divingboard', ['diving', 'board']],
  
  // Dog- compounds
  ['doghouse', ['dog', 'house']],
  
  // Doll- compounds
  ['dollhouse', ['doll', 'house']],
  
  // Doom- compounds
  ['doomsayer', ['doom', 'sayer']],
  ['doomsday', ['dooms', 'day']],
  
  // Door- compounds
  ['doorbell', ['door', 'bell']],
  ['doorknob', ['door', 'knob']],
  ['doorman', ['door', 'man']],
  ['doormat', ['door', 'mat']],
  ['doorstep', ['door', 'step']],
  ['doorway', ['door', 'way']],
  
  // Double- compounds
  ['doubleheader', ['double', 'header']],
  
  // Dove- compounds
  ['dovetail', ['dove', 'tail']],
  
  // Down- compounds
  ['downbeat', ['down', 'beat']],
  ['downcast', ['down', 'cast']],
  ['downfall', ['down', 'fall']],
  ['downgrade', ['down', 'grade']],
  ['downhill', ['down', 'hill']],
  ['download', ['down', 'load']],
  ['downpour', ['down', 'pour']],
  ['downside', ['down', 'side']],
  ['downstairs', ['down', 'stairs']],
  ['downtown', ['down', 'town']],
  ['downturn', ['down', 'turn']],
  
  // Dragon- compounds
  ['dragonfly', ['dragon', 'fly']],
  
  // Draw- compounds
  ['drawback', ['draw', 'back']],
  
  // Dress- compounds
  ['dressmaker', ['dress', 'maker']],
  
  // Drive- compounds
  ['driveway', ['drive', 'way']],
  
  // Drug- compounds
  ['drugstore', ['drug', 'store']],
  
  // Drum- compounds
  ['drumstick', ['drum', 'stick']],
  
  // Dug- compounds
  ['dugout', ['dug', 'out']],
  
  // Dumb- compounds
  ['dumbbell', ['dumb', 'bell']],
  ['dumbfound', ['dumb', 'found']],
  ['dumbstruck', ['dumb', 'struck']],
  
  // Dust- compounds
  ['dustpan', ['dust', 'pan']],
  
  // Ear- compounds
  ['earache', ['ear', 'ache']],
  ['eardrum', ['ear', 'drum']],
  ['earmark', ['ear', 'mark']],
  ['earmuff', ['ear', 'muff']],
  ['earphone', ['ear', 'phone']],
  ['earring', ['ear', 'ring']],
  ['earsplitting', ['ear', 'splitting']],
  ['earwax', ['ear', 'wax']],
  ['earwig', ['ear', 'wig']],
  
  // Earth- compounds
  ['earthquake', ['earth', 'quake']],
  ['earthworm', ['earth', 'worm']],
  
  // Egg- compounds
  ['egghead', ['egg', 'head']],
  ['eggshell', ['egg', 'shell']],
  
  // Electric- compounds
  ['electricguitar', ['electric', 'guitar']],
  
  // End- compounds
  ['endless', ['end', 'less']],
  
  // Ever- compounds
  ['evergreen', ['ever', 'green']],
  ['everlasting', ['ever', 'lasting']],
  
  // Every- compounds
  ['everybody', ['every', 'body']],
  ['everyday', ['every', 'day']],
  ['everyone', ['every', 'one']],
  ['everything', ['every', 'thing']],
  ['everywhere', ['every', 'where']],
  
  // Eye- compounds
  ['eyeball', ['eye', 'ball']],
  ['eyeglasses', ['eye', 'glasses']],
  ['eyelid', ['eye', 'lid']],
  ['eyesight', ['eye', 'sight']],
  ['eyesore', ['eye', 'sore']],
  ['eyewitness', ['eye', 'witness']],
  
  // False- compounds
  ['falsehood', ['false', 'hood']],
  
  // Far- compounds
  ['faraway', ['far', 'away']],
  
  // Fare- compounds
  ['farewell', ['fare', 'well']],
  
  // Farm- compounds
  ['farmhouse', ['farm', 'house']],
  
  // Father- compounds
  ['fatherinlaw', ['father', 'inlaw']],
  ['fatherland', ['father', 'land']],
  
  // Feeble- compounds
  ['feebleminded', ['feeble', 'minded']],
  
  // Feed- compounds
  ['feedback', ['feed', 'back']],
  
  // Figure- compounds
  ['figurehead', ['figure', 'head']],
  
  // Finger- compounds
  ['fingerbowl', ['finger', 'bowl']],
  ['fingerhole', ['finger', 'hole']],
  ['fingernail', ['finger', 'nail']],
  ['fingerpaint', ['finger', 'paint']],
  ['fingerprint', ['finger', 'print']],
  ['fingertip', ['finger', 'tip']],
  
  // Fire- compounds
  ['firedrill', ['fire', 'drill']],
  ['fireengine', ['fire', 'engine']],
  ['fireescape', ['fire', 'escape']],
  ['firestation', ['fire', 'station']],
  ['firetruck', ['fire', 'truck']],
  ['firearm', ['fire', 'arm']],
  ['fireboat', ['fire', 'boat']],
  ['firecracker', ['fire', 'cracker']],
  ['fireeater', ['fire', 'eater']],
  ['firefighter', ['fire', 'fighter']],
  ['firefly', ['fire', 'fly']],
  ['firehouse', ['fire', 'house']],
  ['firelight', ['fire', 'light']],
  ['fireplace', ['fire', 'place']],
  ['fireproof', ['fire', 'proof']],
  ['firewood', ['fire', 'wood']],
  ['fireworks', ['fire', 'works']],
  ['fireball', ['fire', 'ball']],
  
  // Fish- compounds
  ['fishhook', ['fish', 'hook']],
  ['fishpond', ['fish', 'pond']],
  ['fisherman', ['fish', 'er', 'man']],
  
  // Flag- compounds
  ['flagpole', ['flag', 'pole']],
  
  // Flash- compounds
  ['flashback', ['flash', 'back']],
  ['flashlight', ['flash', 'light']],
  
  // Flop- compounds
  ['flophouse', ['flop', 'house']],
  
  // Flow- compounds
  ['flowchart', ['flow', 'chart']],
  
  // Flower- compounds
  ['flowerpot', ['flower', 'pot']],
  
  // Fog- compounds
  ['foghorn', ['fog', 'horn']],
  
  // Folk- compounds
  ['folklore', ['folk', 'lore']],
  
  // Fool- compounds
  ['foolhardy', ['fool', 'hardy']],
  ['foolproof', ['fool', 'proof']],
  
  // Foot- compounds
  ['football', ['foot', 'ball']],
  ['footbridge', ['foot', 'bridge']],
  ['footloose', ['foot', 'loose']],
  ['footpath', ['foot', 'path']],
  ['footprint', ['foot', 'print']],
  ['footrest', ['foot', 'rest']],
  ['footstep', ['foot', 'step']],
  ['footstool', ['foot', 'stool']],
  
  // Fountain- compounds
  ['fountainhead', ['fountain', 'head']],
  
  // Free- compounds
  ['freeware', ['free', 'ware']],
  ['freeway', ['free', 'way']],
  
  // Fresh- compounds
  ['freshman', ['fresh', 'man']],
  
  // Fruit- compounds
  ['fruitcake', ['fruit', 'cake']],
  
  // Gentle- compounds
  ['gentleman', ['gentle', 'man']],
  ['gentleperson', ['gentle', 'person']],
  
  // Girl- compounds
  ['girlfriend', ['girl', 'friend']],
  
  // Gold- compounds
  ['goldfish', ['gold', 'fish']],
  
  // Good- compounds
  ['goodwill', ['good', 'will']],
  
  // Grand- compounds
  ['grandstand', ['grand', 'stand']],
  
  // Grape- compounds
  ['grapevine', ['grape', 'vine']],
  
  // Grass- compounds
  ['grasshopper', ['grass', 'hopper']],
  ['grassland', ['grass', 'land']],
  
  // Grave- compounds
  ['graveyard', ['grave', 'yard']],
  
  // Green- compounds
  ['greenhouse', ['green', 'house']],
  
  // Ground- compounds
  ['groundbreaking', ['ground', 'breaking']],
  ['groundwork', ['ground', 'work']],
  
  // Grown- compounds
  ['grownup', ['grown', 'up']],
  
  // Guide- compounds
  ['guidebook', ['guide', 'book']],
  ['guideline', ['guide', 'line']],
  
  // Hair- compounds
  ['hairbrush', ['hair', 'brush']],
  ['haircut', ['hair', 'cut']],
  ['hairdresser', ['hair', 'dresser']],
  ['hairline', ['hair', 'line']],
  ['hairnet', ['hair', 'net']],
  ['hairpiece', ['hair', 'piece']],
  ['hairpin', ['hair', 'pin']],
  ['hairsplitting', ['hair', 'splitting']],
  ['hairstyle', ['hair', 'style']],
  
  // Half- compounds
  ['halfhearted', ['half', 'hearted']],
  ['halftime', ['half', 'time']],
  ['halfway', ['half', 'way']],
  
  // Hall- compounds
  ['hallway', ['hall', 'way']],
  
  // Hand- compounds
  ['handbag', ['hand', 'bag']],
  ['handball', ['hand', 'ball']],
  ['handbook', ['hand', 'book']],
  ['handcuff', ['hand', 'cuff']],
  ['handfeed', ['hand', 'feed']],
  ['handmade', ['hand', 'made']],
  ['handpick', ['hand', 'pick']],
  ['handsaw', ['hand', 'saw']],
  ['handshake', ['hand', 'shake']],
  ['handstand', ['hand', 'stand']],
  ['handwrit', ['hand', 'writ']],
  ['handwriting', ['hand', 'writing']],
  ['handout', ['hand', 'out']],
  
  // Hard- compounds
  ['hardship', ['hard', 'ship']],
  ['hardware', ['hard', 'ware']],
  ['hardball', ['hard', 'ball']],
  
  // Hare- compounds
  ['harebrained', ['hare', 'brained']],
  
  // Hay- compounds
  ['hayseed', ['hay', 'seed']],
  ['haywire', ['hay', 'wire']],
  
  // Head- compounds
  ['headache', ['head', 'ache']],
  ['headband', ['head', 'band']],
  ['headhunting', ['head', 'hunting']],
  ['headlight', ['head', 'light']],
  ['headlong', ['head', 'long']],
  ['headphone', ['head', 'phone']],
  ['headquarters', ['head', 'quarters']],
  ['headstand', ['head', 'stand']],
  ['headstrong', ['head', 'strong']],
  ['headway', ['head', 'way']],
  ['headwind', ['head', 'wind']],
  
  // Heart- compounds
  ['heartache', ['heart', 'ache']],
  ['heartbreak', ['heart', 'break']],
  ['heartfelt', ['heart', 'felt']],
  ['heartsick', ['heart', 'sick']],
  ['heartwarming', ['heart', 'warming']],
  
  // Heavy- compounds
  ['heavyweight', ['heavy', 'weight']],
  
  // Hen- compounds
  ['henhouse', ['hen', 'house']],
  
  // High- compounds
  ['highchair', ['high', 'chair']],
  ['highjump', ['high', 'jump']],
  ['highnoon', ['high', 'noon']],
  ['highschool', ['high', 'school']],
  ['highbrow', ['high', 'brow']],
  ['highlight', ['high', 'light']],
  ['highrise', ['high', 'rise']],
  ['highway', ['high', 'way']],
  
  // Hill- compounds
  ['hilltop', ['hill', 'top']],
  
  // Hind- compounds
  ['hindsight', ['hind', 'sight']],
  
  // Hog- compounds
  ['hogwash', ['hog', 'wash']],
  
  // Home- compounds
  ['homeplate', ['home', 'plate']],
  ['homerun', ['home', 'run']],
  ['homeboy', ['home', 'boy']],
  ['homegrown', ['home', 'grown']],
  ['homemade', ['home', 'made']],
  ['homeroom', ['home', 'room']],
  ['homesick', ['home', 'sick']],
  ['homespun', ['home', 'spun']],
  ['hometown', ['home', 'town']],
  ['homework', ['home', 'work']],
  
  // Horse- compounds
  ['horseback', ['horse', 'back']],
  ['horsefly', ['horse', 'fly']],
  ['horseplay', ['horse', 'play']],
  ['horseshoe', ['horse', 'shoe']],
  
  // Hot- compounds
  ['hotdog', ['hot', 'dog']],
  ['hotheaded', ['hot', 'headed']],
  
  // House- compounds
  ['houseboat', ['house', 'boat']],
  ['household', ['house', 'hold']],
  ['housekeeper', ['house', 'keeper']],
  ['housework', ['house', 'work']],
  
  // Ice- compounds
  ['iceskate', ['ice', 'skate']],
  ['iceskater', ['ice', 'skater']],
  ['iceberg', ['ice', 'berg']],
  ['iceman', ['ice', 'man']],
  
  // In- compounds
  ['indoor', ['in', 'door']],
  ['inside', ['in', 'side']],
  ['instep', ['in', 'step']],
  
  // Jelly- compounds
  ['jellyfish', ['jelly', 'fish']],
  
  // Key- compounds
  ['keyboard', ['key', 'board']],
  ['keyhole', ['key', 'hole']],
  ['keynote', ['key', 'note']],
  ['keystone', ['key', 'stone']],
  
  // Kick- compounds
  ['kickback', ['kick', 'back']],
  
  // Kid- compounds
  ['kidnap', ['kid', 'nap']],
  
  // Kill- compounds
  ['killjoy', ['kill', 'joy']],
  
  // Kind- compounds
  ['kindhearted', ['kind', 'hearted']],
  
  // Knock- compounds
  ['knockout', ['knock', 'out']],
  
  // Lack- compounds
  ['lackluster', ['lack', 'luster']],
  
  // Land- compounds
  ['landfill', ['land', 'fill']],
  ['landlord', ['land', 'lord']],
  ['landmark', ['land', 'mark']],
  ['landscape', ['land', 'scape']],
  ['landslide', ['land', 'slide']],
  
  // Law- compounds
  ['lawbreaker', ['law', 'breaker']],
  
  // Lawn- compounds
  ['lawnmower', ['lawn', 'mower']],
  
  // Lay- compounds
  ['layperson', ['lay', 'person']],
  ['layout', ['lay', 'out']],
  
  // Left- compounds
  ['leftover', ['left', 'over']],
  
  // Let- compounds
  ['letdown', ['let', 'down']],
  ['letup', ['let', 'up']],
  
  // Level- compounds
  ['levelheaded', ['level', 'headed']],
  
  // Life- compounds
  ['lifeboat', ['life', 'boat']],
  ['lifelike', ['life', 'like']],
  ['lifelong', ['life', 'long']],
  ['lifesaver', ['life', 'saver']],
  ['lifestyle', ['life', 'style']],
  ['lifetime', ['life', 'time']],
  ['lifework', ['life', 'work']],
  
  // Light- compounds
  ['lighthearted', ['light', 'hearted']],
  ['lighthouse', ['light', 'house']],
  ['lightweight', ['light', 'weight']],
  
  // Living- compounds
  ['livingroom', ['living', 'room']],
  
  // Look- compounds
  ['lookout', ['look', 'out']],
  
  // Loud- compounds
  ['loudspeaker', ['loud', 'speaker']],
  
  // Love- compounds
  ['lovelorn', ['love', 'lorn']],
  ['lovesick', ['love', 'sick']],
  
  // Luke- compounds
  ['lukewarm', ['luke', 'warm']],
  
  // Lunch- compounds
  ['lunchroom', ['lunch', 'room']],
  
  // Mad- compounds
  ['madcap', ['mad', 'cap']],
  ['madhouse', ['mad', 'house']],
  
  // Mail- compounds
  ['mailbox', ['mail', 'box']],
  ['mailroom', ['mail', 'room']],
  
  // Main- compounds
  ['mainland', ['main', 'land']],
  ['mainstay', ['main', 'stay']],
  ['mainstream', ['main', 'stream']],
  
  // Make- compounds
  ['makeshift', ['make', 'shift']],
  ['makeup', ['make', 'up']],
  
  // Master- compounds
  ['masterpiece', ['master', 'piece']],
  
  // Match- compounds
  ['matchbook', ['match', 'book']],
  ['matchbox', ['match', 'box']],
  
  // Mean- compounds
  ['meantime', ['mean', 'time']],
  ['meanwhile', ['mean', 'while']],
  
  // Merry- compounds
  ['merrygoround', ['merry', 'goround']],
  
  // Mile- compounds
  ['milestone', ['mile', 'stone']],
  
  // Milk- compounds
  ['milkshake', ['milk', 'shake']],
  ['milkman', ['milk', 'man']],
  
  // Moon- compounds
  ['moonbeam', ['moon', 'beam']],
  ['moonlight', ['moon', 'light']],
  ['moonshine', ['moon', 'shine']],
  
  // Motor- compounds
  ['motorboat', ['motor', 'boat']],
  ['motorcycle', ['motor', 'cycle']],
  
  // Mountain- compounds
  ['mountaintop', ['mountain', 'top']],
  
  // Mouse- compounds
  ['mousetrap', ['mouse', 'trap']],
  
  // Mouth- compounds
  ['mouthpiece', ['mouth', 'piece']],
  
  // Music- compounds
  ['musicbox', ['music', 'box']],
  
  // Near- compounds
  ['nearby', ['near', 'by']],
  ['nearsighted', ['near', 'sighted']],
  
  // Neck- compounds
  ['necklace', ['neck', 'lace']],
  
  // Needle- compounds
  ['needlework', ['needle', 'work']],
  
  // Neighbor- compounds
  ['neighborhood', ['neighbor', 'hood']],
  
  // Net- compounds
  ['network', ['net', 'work']],
  
  // New- compounds
  ['newborn', ['new', 'born']],
  ['newcomer', ['new', 'comer']],
  ['newspaper', ['new', 'spaper']],
  ['newsstand', ['new', 'sstand']],
  ['newsworthy', ['new', 'sworthy']],
  
  // Nick- compounds
  ['nickname', ['nick', 'name']],
  
  // Night- compounds
  ['nightclub', ['night', 'club']],
  ['nightfall', ['night', 'fall']],
  ['nightgown', ['night', 'gown']],
  ['nightmare', ['night', 'mare']],
  ['nighttime', ['night', 'time']],
  
  // Noise- compounds
  ['noiseproof', ['noise', 'proof']],
  
  // Nose- compounds
  ['nosebleed', ['nose', 'bleed']],
  
  // Note- compounds
  ['notebook', ['note', 'book']],
  ['noteworthy', ['note', 'worthy']],
  
  // Numb- compounds
  ['numbskull', ['numb', 'skull']],
  
  // Nurse- compounds
  ['nursemaid', ['nurse', 'maid']],
  
  // Nut- compounds
  ['nutcracker', ['nut', 'cracker']],
  ['nutshell', ['nut', 'shell']],
  
  // Odd- compounds
  ['oddball', ['odd', 'ball']],
  
  // Off- compounds
  ['offbeat', ['off', 'beat']],
  ['offhand', ['off', 'hand']],
  ['offset', ['off', 'set']],
  ['offshoot', ['off', 'shoot']],
  ['offside', ['off', 'side']],
  ['offspring', ['off', 'spring']],
  
  // On- compounds
  ['oncoming', ['on', 'coming']],
  ['oneself', ['one', 'self']],
  ['ongoing', ['on', 'going']],
  ['onlooker', ['on', 'looker']],
  ['onrush', ['on', 'rush']],
  ['onslaught', ['on', 'slaught']],
  ['onto', ['on', 'to']],
  
  // Other- compounds
  ['otherwise', ['other', 'wise']],
  ['otherworldly', ['other', 'worldly']],
  
  // Out- compounds
  ['outburst', ['out', 'burst']],
  ['outcast', ['out', 'cast']],
  ['outclass', ['out', 'class']],
  ['outcome', ['out', 'come']],
  ['outdo', ['out', 'do']],
  ['outdoors', ['out', 'doors']],
  ['outfield', ['out', 'field']],
  ['outgrowth', ['out', 'growth']],
  ['outhouse', ['out', 'house']],
  ['outside', ['out', 'side']],
  
  // Over- compounds
  ['overall', ['over', 'all']],
  ['overbearing', ['over', 'bearing']],
  ['overblown', ['over', 'blown']],
  ['overcoat', ['over', 'coat']],
  ['overdue', ['over', 'due']],
  ['overflow', ['over', 'flow']],
  ['overhaul', ['over', 'haul']],
  ['overhead', ['over', 'head']],
  ['overlap', ['over', 'lap']],
  ['overlook', ['over', 'look']],
  ['overnight', ['over', 'night']],
  ['overpower', ['over', 'power']],
  ['oversee', ['over', 'see']],
  ['overshadow', ['over', 'shadow']],
  ['overtake', ['over', 'take']],
  ['overturn', ['over', 'turn']],
  ['overwrought', ['over', 'wrought']],
  
  // Pace- compounds
  ['pacesetter', ['pace', 'setter']],
  
  // Pain- compounds
  ['painkiller', ['pain', 'killer']],
  ['painstaking', ['pain', 'staking']],
  
  // Pan- compounds
  ['pancake', ['pan', 'cake']],
  
  // Paper- compounds
  ['paperback', ['paper', 'back']],
  
  // Passer- compounds
  ['passerby', ['passer', 'by']],
  
  // Patch- compounds
  ['patchwork', ['patch', 'work']],
  
  // Peace- compounds
  ['peacemaker', ['peace', 'maker']],
  
  // Pea- compounds
  ['peanut', ['pea', 'nut']],
  
  // Photo- compounds
  ['photocopy', ['photo', 'copy']],
  
  // Pick- compounds
  ['pickup', ['pick', 'up']],
  
  // Pillow- compounds
  ['pillowcase', ['pill', 'owcase']],
  
  // Pine- compounds
  ['pinecone', ['pine', 'cone']],
  
  // Pin- compounds
  ['pinwheel', ['pin', 'wheel']],
  
  // Pitch- compounds
  ['pitchfork', ['pitch', 'fork']],
  
  // Play- compounds
  ['playground', ['play', 'ground']],
  ['playhouse', ['play', 'house']],
  ['playmate', ['play', 'mate']],
  ['playpen', ['play', 'pen']],
  ['playroom', ['play', 'room']],
  ['plaything', ['play', 'thing']],
  ['playtime', ['play', 'time']],
  
  // Pocket- compounds
  ['pocketbook', ['pocket', 'book']],
  
  // Pock- compounds
  ['pockmark', ['pock', 'mark']],
  
  // Poison- compounds
  ['poisonivy', ['poison', 'ivy']],
  
  // Polar- compounds
  ['polarbear', ['polar', 'bear']],
  
  // Pop- compounds
  ['popcorn', ['pop', 'corn']],
  
  // Post- compounds
  ['postcard', ['post', 'card']],
  ['postman', ['post', 'man']],
  
  // Proof- compounds
  ['proofread', ['proof', 'read']],
  
  // Psycho- compounds
  ['psychobabble', ['psycho', 'babble']],
  
  // Push- compounds
  ['pushover', ['push', 'over']],
  
  // Quarrel- compounds
  ['quarrelsome', ['quarrel', 'some']],
  
  // Quick- compounds
  ['quicksand', ['quick', 'sand']],
  
  // Race- compounds
  ['racehorse', ['race', 'horse']],
  
  // Rail- compounds
  ['railroad', ['rail', 'road']],
  ['railway', ['rail', 'way']],
  
  // Rain- compounds
  ['rainbow', ['rain', 'bow']],
  ['raincoat', ['rain', 'coat']],
  ['raindrop', ['rain', 'drop']],
  ['rainfall', ['rain', 'fall']],
  
  // Ring- compounds
  ['ringmaster', ['ring', 'master']],
  
  // River- compounds
  ['riverboat', ['river', 'boat']],
  
  // Road- compounds
  ['roadside', ['road', 'side']],
  
  // Roof- compounds
  ['roofgarden', ['roof', 'garden']],
  ['rooftop', ['roof', 'top']],
  
  // Room- compounds
  ['roommate', ['room', 'mate']],
  
  // Rose- compounds
  ['rosebud', ['rose', 'bud']],
  ['rosebush', ['rose', 'bush']],
  
  // Round- compounds
  ['roundabout', ['round', 'about']],
  ['roundup', ['round', 'up']],
  
  // Row- compounds
  ['rowboat', ['row', 'boat']],
  
  // Rubber- compounds
  ['rubberneck', ['rubber', 'neck']],
  
  // Run- compounds
  ['rundown', ['run', 'down']],
  ['runway', ['run', 'way']],
  
  // Safe- compounds
  ['safeguard', ['safe', 'guard']],
  ['safekeeping', ['safe', 'keeping']],
  
  // Sail- compounds
  ['sailboat', ['sail', 'boat']],
  
  // Sales- compounds
  ['salesperson', ['sales', 'person']],
  ['salesman', ['sales', 'man']],
  
  // Sand- compounds
  ['sandbox', ['sand', 'box']],
  ['sandpaper', ['sand', 'paper']],
  
  // Sauce- compounds
  ['saucepan', ['sauce', 'pan']],
  
  // Saw- compounds
  ['sawdust', ['saw', 'dust']],
  ['sawmill', ['saw', 'mill']],
  
  // Scare- compounds
  ['scarecrow', ['scare', 'crow']],
  
  // School- compounds
  ['schoolhouse', ['school', 'house']],
  
  // Score- compounds
  ['scoreboard', ['score', 'board']],
  
  // Scrap- compounds
  ['scrapbook', ['scrap', 'book']],
  
  // Sea- compounds
  ['seabreeze', ['sea', 'breeze']],
  ['seacaptain', ['sea', 'captain']],
  ['seagull', ['sea', 'gull']],
  ['seahorse', ['sea', 'horse']],
  ['seacoast', ['sea', 'coast']],
  ['seafood', ['sea', 'food']],
  ['seaport', ['sea', 'port']],
  ['seashell', ['sea', 'shell']],
  ['seashore', ['sea', 'shore']],
  ['seaside', ['sea', 'side']],
  ['season', ['sea', 'son']],
  ['seatbelt', ['sea', 'tbelt']],
  ['seaward', ['sea', 'ward']],
  ['seaway', ['sea', 'way']],
  ['seaweed', ['sea', 'weed']],
  
  // Sell- compounds
  ['sellout', ['sell', 'out']],
  
  // Send- compounds
  ['sendoff', ['send', 'off']],
  
  // Set- compounds
  ['setback', ['set', 'back']],
  ['setup', ['set', 'up']],
  
  // Shame- compounds
  ['shamefaced', ['shame', 'faced']],
  
  // Ship- compounds
  ['shipshape', ['ship', 'shape']],
  
  // Shoe- compounds
  ['shoelace', ['shoe', 'lace']],
  ['shoestring', ['shoe', 'string']],
  
  // Shop- compounds
  ['shopkeeper', ['shop', 'keeper']],
  
  // Shore- compounds
  ['shoreline', ['shore', 'line']],
  
  // Short- compounds
  ['shortchange', ['short', 'change']],
  ['shortcoming', ['short', 'coming']],
  ['shortcut', ['short', 'cut']],
  ['shortfall', ['short', 'fall']],
  ['shortstop', ['short', 'stop']],
  
  // Show- compounds
  ['showdown', ['show', 'down']],
  ['showoff', ['show', 'off']],
  
  // Side- compounds
  ['sidekick', ['side', 'kick']],
  ['sidestep', ['side', 'step']],
  ['sidetrack', ['side', 'track']],
  ['sidewalk', ['side', 'walk']],
  ['sideways', ['side', 'ways']],
  
  // Skate- compounds
  ['skateboard', ['skate', 'board']],
  
  // Sky- compounds
  ['skyline', ['sky', 'line']],
  ['skyscraper', ['sky', 'scraper']],
  
  // Slow- compounds
  ['slowdown', ['slow', 'down']],
  ['slowpoke', ['slow', 'poke']],
  
  // Smoke- compounds
  ['smokestack', ['smoke', 'stack']],
  
  // Snap- compounds
  ['snapshot', ['snap', 'shot']],
  
  // Snow- compounds
  ['snowball', ['snow', 'ball']],
  ['snowfall', ['snow', 'fall']],
  ['snowflake', ['snow', 'flake']],
  ['snowman', ['snow', 'man']],
  ['snowplow', ['snow', 'plow']],
  ['snowshoe', ['snow', 'shoe']],
  ['snowstorm', ['snow', 'storm']],
  ['snowsuit', ['snow', 'suit']],
  
  // Soft- compounds
  ['softhearted', ['soft', 'hearted']],
  ['softball', ['soft', 'ball']],
  
  // Some- compounds
  ['somebody', ['some', 'body']],
  ['someday', ['some', 'day']],
  ['someone', ['some', 'one']],
  ['something', ['some', 'thing']],
  ['sometimes', ['some', 'times']],
  ['someway', ['some', 'way']],
  ['somewhat', ['some', 'what']],
  ['somewhere', ['some', 'where']],
  ['someplace', ['some', 'place']],
  
  // Space- compounds
  ['spaceship', ['space', 'ship']],
  ['spacesuit', ['space', 'suit']],
  ['spaceman', ['space', 'man']],
  
  // Spell- compounds
  ['spellbound', ['spell', 'bound']],
  
  // Spend- compounds
  ['spendthrift', ['spend', 'thrift']],
  
  // Spokes- compounds
  ['spokesperson', ['spokes', 'person']],
  
  // Sports- compounds
  ['sportscar', ['sports', 'car']],
  
  // Spring- compounds
  ['springtime', ['spring', 'time']],
  
  // Stand- compounds
  ['standstill', ['stand', 'still']],
  
  // Star- compounds
  ['starfish', ['star', 'fish']],
  ['starlight', ['star', 'light']],
  ['starship', ['star', 'ship']],
  
  // Steam- compounds
  ['steamboat', ['steam', 'boat']],
  
  // Step- compounds
  ['stepladder', ['step', 'ladder']],
  
  // Stock- compounds
  ['stockpile', ['stock', 'pile']],
  
  // Store- compounds
  ['storehouse', ['store', 'house']],
  ['storekeeper', ['store', 'keeper']],
  ['storeroom', ['store', 'room']],
  
  // Story- compounds
  ['storybook', ['story', 'book']],
  ['storyteller', ['story', 'teller']],
  
  // Straight- compounds
  ['straightforward', ['straight', 'forward']],
  
  // Street- compounds
  ['streetcar', ['street', 'car']],
  ['streetlight', ['street', 'light']],
  
  // Summer- compounds
  ['summertime', ['summer', 'time']],
  
  // Sun- compounds
  ['sunburn', ['sun', 'burn']],
  ['sunflower', ['sun', 'flower']],
  ['sunlight', ['sun', 'light']],
  ['sunrise', ['sun', 'rise']],
  ['sunset', ['sun', 'set']],
  ['sunshine', ['sun', 'shine']],
  
  // Super- compounds
  ['supermarket', ['super', 'market']],
  ['supernatural', ['super', 'natural']],
  ['superman', ['su', 'per', 'man']],
  
  // Surf- compounds
  ['surfboard', ['surf', 'board']],
  
  // Sweet- compounds
  ['sweetheart', ['sweet', 'heart']],
  
  // Swimming- compounds
  ['swimmingpool', ['swimming', 'pool']],
  
  // Swim- compounds
  ['swimsuit', ['swim', 'suit']],
  
  // Table- compounds
  ['tablespoon', ['table', 'spoon']],
  ['tableware', ['table', 'ware']],
  
  // Take- compounds
  ['takeoff', ['take', 'off']],
  ['takeout', ['take', 'out']],
  
  // Tail- compounds
  ['tailwind', ['tail', 'wind']],
  
  // Task- compounds
  ['taskmaster', ['task', 'master']],
  
  // Tattle- compounds
  ['tattletale', ['tattle', 'tale']],
  
  // Tea- compounds
  ['teacup', ['tea', 'cup']],
  ['teaspoon', ['tea', 'spoon']],
  
  // Teen- compounds
  ['teenage', ['teen', 'age']],
  
  // Tender- compounds
  ['tenderhearted', ['tender', 'hearted']],
  
  // Tennis- compounds
  ['tenniscourt', ['tennis', 'court']],
  
  // Text- compounds
  ['textbook', ['text', 'book']],
  
  // There- compounds
  ['thereabout', ['there', 'about']],
  ['thereafter', ['there', 'after']],
  ['therefore', ['there', 'fore']],
  
  // Thunder- compounds
  ['thunderstorm', ['thunder', 'storm']],
  ['thunderstruck', ['thunder', 'struck']],
  
  // Tight- compounds
  ['tightrope', ['tight', 'rope']],
  ['tightwad', ['tight', 'wad']],
  
  // Time- compounds
  ['timetable', ['time', 'ta', 'ble']],
  ['timeframe', ['time', 'frame']],
  ['timeline', ['time', 'line']],
  ['timeout', ['time', 'out']],
  ['timekeeper', ['time', 'keep', 'er']],
  ['timeslot', ['time', 'slot']],
  ['timestamp', ['time', 'stamp']],
  ['timecard', ['time', 'card']],
  ['timeshare', ['time', 'share']],
  ['timepiece', ['time', 'piece']],
  ['timeless', ['time', 'less']],
  ['timely', ['time', 'ly']],
  
  // Tip- compounds
  ['tipoff', ['tip', 'off']],
  
  // Toad- compounds
  ['toadstool', ['toad', 'stool']],
  
  // Toe- compounds
  ['toenail', ['toe', 'nail']],
  ['toeshoe', ['toe', 'shoe']],
  
  // Tool- compounds
  ['toolbox', ['tool', 'box']],
  
  // Tooth- compounds
  ['toothache', ['tooth', 'ache']],
  ['toothbrush', ['tooth', 'brush']],
  ['toothpaste', ['tooth', 'paste']],
  
  // Top- compounds
  ['topcoat', ['top', 'coat']],
  
  // Touch- compounds
  ['touchdown', ['touch', 'down']],
  
  // Town- compounds
  ['townspeople', ['town', 'speople']],
  
  // Trade- compounds
  ['trademark', ['trade', 'mark']],
  
  // Tree- compounds
  ['treetop', ['tree', 'top']],
  
  // Trouble- compounds
  ['troublemaker', ['trouble', 'maker']],
  ['troubleshooter', ['trouble', 'shooter']],
  ['troublesome', ['trouble', 'some']],
  
  // Trust- compounds
  ['trustworthy', ['trust', 'worthy']],
  
  // Tug- compounds
  ['tugboat', ['tug', 'boat']],
  
  // Turn- compounds
  ['turnout', ['turn', 'out']],
  ['turnpike', ['turn', 'pike']],
  
  // Type- compounds
  ['typewriter', ['type', 'writer']],
  
  // Under- compounds
  ['undercover', ['under', 'cover']],
  ['undercurrent', ['under', 'current']],
  ['underdog', ['under', 'dog']],
  ['underground', ['under', 'ground']],
  ['underhand', ['under', 'hand']],
  ['underline', ['under', 'line']],
  ['understudy', ['under', 'study']],
  ['undertaker', ['under', 'taker']],
  ['underwater', ['under', 'water']],
  ['underwear', ['under', 'wear']],
  
  // Up- compounds
  ['upbeat', ['up', 'beat']],
  ['update', ['up', 'date']],
  ['upgrade', ['up', 'grade']],
  ['uphill', ['up', 'hill']],
  ['uplift', ['up', 'lift']],
  ['uppermost', ['up', 'permost']],
  ['upright', ['up', 'right']],
  ['uproot', ['up', 'root']],
  ['upstage', ['up', 'stage']],
  ['upstairs', ['up', 'stairs']],
  
  // Video- compounds
  ['videocassette', ['video', 'cassette']],
  
  // View- compounds
  ['viewpoint', ['view', 'point']],
  
  // Vine- compounds
  ['vineyard', ['vine', 'yard']],
  
  // Wall- compounds
  ['wallpaper', ['wall', 'paper']],
  
  // War- compounds
  ['warehouse', ['ware', 'house']],
  ['warlike', ['war', 'like']],
  ['warlock', ['war', 'lock']],
  ['warmonger', ['war', 'monger']],
  
  // Warm- compounds
  ['warmhearted', ['warm', 'hearted']],
  
  // Wash- compounds
  ['washcloth', ['wash', 'cloth']],
  ['washout', ['wash', 'out']],
  
  // Waste- compounds
  ['wastebasket', ['waste', 'basket']],
  
  // Watch- compounds
  ['watchdog', ['watch', 'dog']],
  ['watchkeeper', ['watch', 'keeper']],
  
  // Water- compounds
  ['watercolor', ['water', 'color']],
  ['waterfall', ['water', 'fall']],
  ['waterlogged', ['water', 'logged']],
  ['waterproof', ['water', 'proof']],
  ['waterway', ['wa', 'ter', 'way']],
  
  // Way- compounds
  ['wayward', ['way', 'ward']],
  
  // Weather- compounds
  ['weatherman', ['weath', 'er', 'man']],
  
  // Wed- compounds
  ['wedlock', ['wed', 'lock']],
  
  // Week- compounds
  ['weekend', ['week', 'end']],
  ['weekday', ['week', 'day']],
  
  // West- compounds
  ['westwind', ['west', 'wind']],
  
  // What- compounds
  ['whatever', ['what', 'ever']],
  
  // Wheel- compounds
  ['wheelchair', ['wheel', 'chair']],
  
  // When- compounds
  ['whenever', ['when', 'ever']],
  
  // Where- compounds
  ['whereas', ['where', 'as']],
  ['whereby', ['where', 'by']],
  
  // Whirl- compounds
  ['whirlpool', ['whirl', 'pool']],
  ['whirlwind', ['whirl', 'wind']],
  
  // White- compounds
  ['whitewash', ['white', 'wash']],
  
  // Who- compounds
  ['whoever', ['who', 'ever']],
  
  // Will- compounds
  ['willpower', ['will', 'power']],
  
  // Wind- compounds
  ['windmill', ['wind', 'mill']],
  ['windpipe', ['wind', 'pipe']],
  ['windshield', ['wind', 'shield']],
  ['westwind', ['west', 'wind']],
  ['eastwind', ['east', 'wind']],
  ['northwind', ['north', 'wind']],
  ['southwind', ['south', 'wind']],
  ['headwind', ['head', 'wind']],
  ['tailwind', ['tail', 'wind']],
  ['crosswind', ['cross', 'wind']],
  ['whirlwind', ['whirl', 'wind']],
  
  // Winter- compounds
  ['wintertime', ['winter', 'time']],
  
  // Wish- compounds
  ['wishbone', ['wish', 'bone']],
  
  // With- compounds
  ['withdraw', ['with', 'draw']],
  ['withdrawal', ['with', 'drawal']],
  ['withdrawn', ['with', 'drawn']],
  ['withheld', ['with', 'held']],
  ['withhold', ['with', 'hold']],
  ['without', ['with', 'out']],
  ['withstand', ['with', 'stand']],
  
  // Wood- compounds
  ['woodland', ['wood', 'land']],
  ['woodpecker', ['wood', 'pecker']],
  ['woodsman', ['wood', 'sman']],
  ['woodwork', ['wood', 'work']],
  
  // Work- compounds
  ['workbench', ['work', 'bench']],
  ['workbook', ['work', 'book']],
  ['workday', ['work', 'day']],
  ['workout', ['work', 'out']],
  ['worktable', ['work', 'table']],
  ['workman', ['work', 'man']],
  ['workplace', ['work', 'place']],
  
  // World- compounds
  ['worldwide', ['world', 'wide']],
  
  // Worth- compounds
  ['worthwhile', ['worth', 'while']],
  
  // Wrist- compounds
  ['wristwatch', ['wrist', 'watch']],
  
  // Yard- compounds
  ['yardstick', ['yard', 'stick']],
  
  // Year- compounds
  ['yearbook', ['year', 'book']],
  ['yesterday', ['yes', 'ter', 'day']],
  
  // Your- compounds
  ['yourself', ['your', 'self']],
  
  // Zoo- compounds
  ['zookeeper', ['zoo', 'keeper']],
  
  // Classic compound words for completeness
  ['comeback', ['come', 'back']],
  ['flashback', ['flash', 'back']],
  ['throwback', ['throw', 'back']],
  ['payback', ['pay', 'back']],
  ['drawback', ['draw', 'back']],
  ['lockout', ['lock', 'out']],
  ['walkout', ['walk', 'out']],
  ['fallout', ['fall', 'out']],
  ['blackout', ['black', 'out']],
  ['buyout', ['buy', 'out']],
  ['payout', ['pay', 'out']],
  ['slideshow', ['slide', 'show']],
  ['volleyball', ['vol', 'ley', 'ball']],
  ['fastball', ['fast', 'ball']],
  ['curveball', ['curve', 'ball']],
  ['meatball', ['meat', 'ball']],
  ['businessman', ['bus', 'i', 'ness', 'man']],
  ['policeman', ['po', 'lice', 'man']],
  ['chairman', ['chair', 'man']],
  ['caveman', ['cave', 'man']],
  ['cheesecake', ['cheese', 'cake']],
  ['everyday', ['ev', 'ery', 'day']],
  ['today', ['to', 'day']],
  ['holiday', ['hol', 'i', 'day']],
  ['marketplace', ['mar', 'ket', 'place']],
  ['pathway', ['path', 'way']],
  ['subway', ['sub', 'way']],
  ['gateway', ['gate', 'way']],
  ['causeway', ['cause', 'way']],
  ['midnight', ['mid', 'night']],
  ['spotlight', ['spot', 'light']],
  ['stoplight', ['stop', 'light']],
  ['judgment', ['judg', 'ment']],
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
  // Single syllable prefixes
  ['un', ['un']],          // un-happy
  ['re', ['re']],          // re-do
  ['in', ['in']],          // in-active
  ['im', ['im']],          // im-possible
  ['dis', ['dis']],        // dis-agree
  ['mis', ['mis']],        // mis-take
  ['pre', ['pre']],        // pre-view
  ['post', ['post']],      // post-war
  ['out', ['out']],        // out-side
  ['sub', ['sub']],        // sub-way
  ['non', ['non']],        // non-sense
  ['de', ['de']],          // de-code
  ['ex', ['ex']],          // ex-port
  ['sur', ['sur']],        // sur-prise, sur-face
  ['con', ['con']],        // con-nect
  ['com', ['com']],        // com-bine
  ['pro', ['pro']],        // pro-duce
  ['up', ['up']],          // up-grade
  ['bi', ['bi']],          // bi-cycle
  ['tri', ['tri']],        // tri-angle
  ['ir', ['ir']],          // ir-regular
  ['il', ['il']],          // il-legal
  ['fore', ['fore']],      // fore-cast
  ['trans', ['trans']],    // trans-port, trans-atlantic

  // Two syllable prefixes
  ['over', ['o', 'ver']],  // o-ver-do
  ['under', ['un', 'der']], // un-der-stand
  ['super', ['su', 'per']], // su-per-man
  ['inter', ['in', 'ter']], // in-ter-act
  ['anti', ['an', 'ti']],  // an-ti-body, an-ti-social
  ['semi', ['sem', 'i']],  // sem-i-circle
  ['auto', ['au', 'to']],  // au-to-matic
  ['micro', ['mi', 'cro']], // mi-cro-scope
  ['ultra', ['ul', 'tra']], // ul-tra-sound
  ['extra', ['ex', 'tra']], // ex-tra-ordinary
  ['counter', ['coun', 'ter']], // coun-ter-act, coun-ter-productive
  ['para', ['pa', 'ra']],  // pa-ra-graph
  ['meta', ['met', 'a']],  // met-a-data
  ['hyper', ['hy', 'per']], // hy-per-active
  ['pseudo', ['pseu', 'do']], // pseu-do-science
  ['neo', ['ne', 'o']],    // ne-o-classical
  ['proto', ['pro', 'to']], // pro-to-type
  ['tele', ['tel', 'e']],  // tel-e-phone
  ['mono', ['mon', 'o']],  // mon-o-tone
  ['poly', ['pol', 'y']],  // pol-y-gon
  ['mega', ['meg', 'a']],  // meg-a-byte
  ['giga', ['gig', 'a']],  // gig-a-byte
  ['mini', ['min', 'i']],  // min-i-mum
  ['maxi', ['max', 'i']],  // max-i-mum
  ['after', ['af', 'ter']], // af-ter-noon
  ['intro', ['in', 'tro']], // in-tro-duce
  ['retro', ['ret', 'ro']], // ret-ro-spective
  ['multi', ['mul', 'ti']], // mul-ti-ple

  // Three syllable prefixes
  ['circum', ['cir', 'cum']], // cir-cum-ference
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

    // Check for compound words first (highest priority for compound word splitting)
    if (COMPOUND_WORDS.has(lowerWord)) {
      const syllables = COMPOUND_WORDS.get(lowerWord)!;
      return {
        boundaries: [], // No boundaries needed for complete overrides
        preservedUnits: [{
          start: 0,
          end: word.length,
          syllables: [...syllables]
        }]
      };
    }

    // Check for R-controlled + ience words second (highest priority complete word overrides)
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