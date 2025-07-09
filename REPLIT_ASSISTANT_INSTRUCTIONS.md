# Instructions for Replit Assistant: ReadSmart Syllabification System

## Project Overview
ReadSmart is an educational text processing application that breaks down words into syllables for reading instruction. The core syllabification system uses the CMU Pronouncing Dictionary (125,770 entries) with educational linguistic rules.

## File Structure
- **Primary file**: `server/utils/syllable.ts` - Contains the CMUSyllabifier class
- **Documentation**: `replit.md` - Contains changelog and system architecture
- **Test endpoint**: `GET /api/word/{word}` - Returns syllable breakdown

## Syllabification System Architecture

### 1. Five-Tier Priority System (in order of precedence):

#### Priority 1: Morphological Overrides (MORPHOLOGICAL_OVERRIDES Map)
- **Purpose**: Educational clarity - show root words + suffixes
- **Examples**: 
  - "testing" → "test-ing" (not "tes-ting")
  - "surprisingly" → "sur-pri-sing-ly"
  - "international" → "in-ter-na-tion-al"
- **When to add**: When a word needs to show clear morphological structure

#### Priority 2: Consonant Cluster Rules
- **WORD_INITIAL_CLUSTERS**: Clusters that can start English words (bl, br, cl, cr, etc.)
- **NEVER_INITIAL_CLUSTERS**: Clusters that cannot start words (nt, nd, nk, mp, etc.)
- **Rule**: Keep clusters together if they can start words, split if they cannot

#### Priority 3: Phonetic Rules
- **c+i/e/y rule**: "c" + vowel stays together when c makes /s/ sound
- **g+i/e/y rule**: "g" + vowel stays together when g makes /j/ sound (uses CMU phoneme data)
- **consonant+y rule**: Consonants go with final "y" when y acts as vowel

#### Priority 4: Open Syllables
- **Preference**: Split to create open syllables (ending in vowel) when possible
- **Examples**: "ta-ble", "ti-ger", "ro-bot"

#### Priority 5: Default Consonant Placement
- **Rule**: Single consonants go to the left of the following vowel

### 2. Implementation Details

#### Adding New Morphological Overrides:
```typescript
// In MORPHOLOGICAL_OVERRIDES Map (around line 63)
['wordname', ['syl', 'la', 'ble', 'break', 'down']],
```

#### Common Patterns to Override:
- **-ous endings**: "unanimous" → "u-na-ni-mous" (keep "ous" together)
- **-tion/-sion endings**: Keep these suffixes intact
- **-ly adverbs**: Separate cleanly from root words
- **-ing/-er/-est**: Show as clear suffixes
- **-ed endings**: SPECIAL RULE - only creates new syllable after 't' or 'd' sounds (see below)

## Procedures for Common Corrections

### When User Reports Incorrect Syllabification:

1. **Test the word**: Use `curl -s http://localhost:5000/api/word/{word}` to see current output

2. **Determine fix type**:
   - **Morphological issue**: Add to MORPHOLOGICAL_OVERRIDES map
   - **Consonant cluster issue**: Check if cluster rules need adjustment
   - **Phonetic issue**: May need special case handling

3. **Add morphological override** (most common):
   ```typescript
   ['problematic_word', ['correct', 'syl', 'la', 'ble', 'break', 'down']],
   ```

4. **Test the fix**: Curl the endpoint again to verify

5. **Update replit.md**: Add changelog entry with date and description

### Example Workflow:
```
User: "committee" shows as "com-mit-tee" but should be "com-mit-tee" 
→ This is actually correct, no change needed

User: "unanimously" shows as "u-na-ni-mou-sly" but should be "u-na-ni-mous-ly"
→ Add: ['unanimously', ['u', 'na', 'ni', 'mous', 'ly']] to overrides
```

## Common Educational Patterns

### Suffix Patterns to Preserve:
- **-tion/-sion**: "na-tion", "deci-sion"
- **-ous**: "fa-mous", "anx-ious"
- **-al**: "na-tion-al", "person-al"
- **-ly**: "clear-ly", "obvious-ly"
- **-ing**: "read-ing", "walk-ing"
- **-ed**: "walk-ed", "need-ed"

### Root Word Preservation:
- Show clear boundaries between roots and suffixes
- Preserve recognizable word parts for learning
- Prioritize pedagogical value over pure phonetic accuracy

## Testing and Validation

1. **Test endpoint**: `GET /api/word/{word}`
2. **Expected response format**:
   ```json
   {
     "success": true,
     "word": "example",
     "syllables": ["ex", "am", "ple"]
   }
   ```
3. **Restart required**: Changes to syllable.ts require server restart

## Key Principles

1. **Educational over phonetic**: Prioritize learning value
2. **Morphological awareness**: Show word structure clearly
3. **Consistency**: Follow established patterns
4. **Documentation**: Always update replit.md with changes

## Common Commands

```bash
# Test a word
curl -s http://localhost:5000/api/word/example

# Restart server (if needed)
# Server auto-restarts via workflow

# View current overrides
grep -n "MORPHOLOGICAL_OVERRIDES" server/utils/syllable.ts
```

## Special Rules

### -ed Past Tense Syllabification (IMPORTANT)
The system automatically handles "-ed" endings based on phonetic pronunciation:

**Creates NEW syllable** (makes /ɪd/ sound):
- After 't' or 'd' sounds: "wanted" → "wa-nted", "needed" → "nee-ded", "started" → "star-ted"

**Joins with previous syllable** (makes /t/ or /d/ sound):
- After all other sounds: "walked" → "walked", "played" → "played", "jumped" → "jumped"

**Implementation**: This is handled automatically in `handleMorphologicalPatterns()` function around line 620. No manual overrides needed for regular "-ed" words.

This system has been refined through extensive testing and follows linguistic principles established for educational pronunciation instruction.