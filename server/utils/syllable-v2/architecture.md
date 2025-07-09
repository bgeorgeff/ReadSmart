# Syllabification V2 Architecture

## Core Principles
1. **One Vowel Sound = One Syllable** (fundamental rule)
2. **Morphology Before Phonetics** (educational priority)
3. **Pattern Recognition Over Hardcoding** (maintainability)

## Module Structure

### 1. Core Module (`core.ts`)
- Main orchestrator class
- CMU dictionary integration
- Caching layer for performance
- API interface

### 2. Vowel Sound Detector (`vowel-detector.ts`)
- Phoneme-to-letter mapping
- Vowel cluster recognition (ai, ea, oo, ie, etc.)
- Diphthong handling
- Silent letter detection

### 3. Morphological Analyzer (`morphological.ts`)
- Prefix detection with boundary preservation
- Suffix detection with phonetic rules
- Compound word recognition
- Root word extraction

### 4. Phonetic Processor (`phonetic.ts`)
- Consonant cluster rules
- Special combinations (ch, sh, th, ph, etc.)
- Syllable stress patterns
- Regional pronunciation variants

### 5. Pattern Engine (`patterns.ts`)
- Common syllable patterns (CV, CVC, CVCe, etc.)
- Exception patterns
- Language origin patterns (Greek, Latin, Germanic)

### 6. Fallback Rules (`fallback.ts`)
- Basic CV splitting
- Open syllable preference
- Emergency single-syllable return

## Data Structures

### Pattern Definition
```typescript
interface SyllablePattern {
  pattern: RegExp;
  priority: number;
  action: 'split' | 'keep' | 'custom';
  customHandler?: (match: RegExpMatchArray) => string[];
}
```

### Morpheme Database
```typescript
interface Morpheme {
  text: string;
  type: 'prefix' | 'suffix' | 'root';
  syllables: string[];
  combinesWith?: string[];
}
```

## Processing Pipeline

1. **Input Normalization**
   - Clean punctuation
   - Handle contractions
   - Case normalization

2. **CMU Lookup**
   - Check dictionary first
   - Extract phoneme data

3. **Morphological Analysis**
   - Identify affixes
   - Extract root word
   - Mark boundaries

4. **Vowel Sound Mapping**
   - Map phonemes to letters
   - Identify syllable nuclei

5. **Rule Application**
   - Apply morphological boundaries
   - Apply phonetic rules
   - Apply structural patterns

6. **Validation**
   - Ensure each syllable has vowel
   - Check against known patterns
   - Performance metrics

## Testing Strategy

### Unit Tests
- Each module independently
- Pattern matching accuracy
- Edge case handling

### Integration Tests
- Full pipeline testing
- Performance benchmarks
- Memory usage profiling

### Educational Validation
- Grade-level vocabulary lists
- Common reading errors
- Teacher feedback integration

## Migration Plan

### Phase 1: Foundation (Week 1)
- Build vowel detector
- Implement core orchestrator
- Basic CMU integration

### Phase 2: Rules (Week 2)
- Morphological analyzer
- Phonetic processor
- Pattern engine

### Phase 3: Testing (Week 3)
- Comprehensive test suite
- Performance optimization
- A/B testing setup

### Phase 4: Migration (Week 4)
- Feature flag implementation
- Gradual rollout
- Monitor error rates

## Success Metrics

### Accuracy Targets
- 95%+ on K-12 vocabulary
- 90%+ on technical terms
- 85%+ on proper nouns

### Performance Targets
- <50ms average response
- <100ms 95th percentile
- <1MB memory overhead

### Quality Metrics
- Zero hardcoded overrides
- <5% regression from v1
- Teacher approval rating >90%