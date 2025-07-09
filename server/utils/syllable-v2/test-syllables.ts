/**
 * Test Suite for Syllabification V2
 * Tests problematic words and grade-level vocabulary
 */

import { breakWordIntoSyllablesV2 } from './core.js';

interface TestCase {
  word: string;
  expected: string;
  category: string;
}

const TEST_CASES: TestCase[] = [
  // Problem words from proposal
  { word: 'experience', expected: 'ex-per-i-ence', category: 'suffix-ence' },
  { word: 'revolutionary', expected: 're-vo-lu-tion-a-ry', category: 'complex' },
  { word: 'international', expected: 'in-ter-na-tion-al', category: 'suffix-tion-al' },
  
  // Words with special suffixes
  { word: 'patience', expected: 'pa-tience', category: 'suffix-tience' },
  { word: 'conscience', expected: 'con-science', category: 'suffix-science' },
  { word: 'musician', expected: 'mu-si-cian', category: 'suffix-cian' },
  { word: 'precious', expected: 'pre-cious', category: 'suffix-cious' },
  { word: 'special', expected: 'spe-cial', category: 'suffix-cial' },
  { word: 'sufficient', expected: 'suf-fi-cient', category: 'suffix-cient' },
  { word: 'suspicion', expected: 'su-spi-cion', category: 'suffix-cion' },
  { word: 'tension', expected: 'ten-sion', category: 'suffix-sion' },
  { word: 'region', expected: 're-gion', category: 'suffix-gion' },
  { word: 'religious', expected: 're-li-gious', category: 'suffix-gious' },
  { word: 'famous', expected: 'fa-mous', category: 'suffix-ous' },
  
  // -ed suffix tests
  { word: 'wanted', expected: 'want-ed', category: 'ed-creates-syllable' },
  { word: 'needed', expected: 'need-ed', category: 'ed-creates-syllable' },
  { word: 'started', expected: 'start-ed', category: 'ed-creates-syllable' },
  { word: 'tested', expected: 'test-ed', category: 'ed-creates-syllable' },
  { word: 'walked', expected: 'walked', category: 'ed-no-syllable' },
  { word: 'played', expected: 'played', category: 'ed-no-syllable' },
  { word: 'jumped', expected: 'jumped', category: 'ed-no-syllable' },
  
  // Morphological tests
  { word: 'unhappy', expected: 'un-hap-py', category: 'prefix' },
  { word: 'rewrite', expected: 're-write', category: 'prefix' },
  { word: 'preview', expected: 'pre-view', category: 'prefix' },
  { word: 'disappear', expected: 'dis-ap-pear', category: 'prefix' },
  
  // Vowel sound tests
  { word: 'approved', expected: 'ap-proved', category: 'vowel-sounds' },
  { word: 'beautiful', expected: 'beau-ti-ful', category: 'vowel-sounds' },
  { word: 'create', expected: 'cre-ate', category: 'vowel-sounds' },
  
  // Y as vowel
  { word: 'any', expected: 'a-ny', category: 'y-vowel' },
  { word: 'many', expected: 'ma-ny', category: 'y-vowel' },
  { word: 'very', expected: 've-ry', category: 'y-vowel' },
  { word: 'only', expected: 'on-ly', category: 'y-vowel' },
  { word: 'happy', expected: 'hap-py', category: 'y-vowel' },
  
  // Complex words
  { word: 'unanimously', expected: 'u-na-ni-mous-ly', category: 'complex' },
  { word: 'surprisingly', expected: 'sur-pri-sing-ly', category: 'complex' },
  { word: 'mathematics', expected: 'math-e-mat-ics', category: 'complex' },
  { word: 'geography', expected: 'ge-og-ra-phy', category: 'complex' },
  
  // Open syllables
  { word: 'tiger', expected: 'ti-ger', category: 'open-syllable' },
  { word: 'table', expected: 'ta-ble', category: 'open-syllable' },
  { word: 'robot', expected: 'ro-bot', category: 'open-syllable' },
  
  // Consonant clusters
  { word: 'incredible', expected: 'in-cre-di-ble', category: 'consonant-cluster' },
  { word: 'center', expected: 'cen-ter', category: 'consonant-cluster' },
  { word: 'simple', expected: 'sim-ple', category: 'consonant-cluster' },
  
  // Silent e
  { word: 'make', expected: 'make', category: 'silent-e' },
  { word: 'time', expected: 'time', category: 'silent-e' },
  { word: 'hope', expected: 'hope', category: 'silent-e' },
  
  // Basic words
  { word: 'cat', expected: 'cat', category: 'basic' },
  { word: 'dog', expected: 'dog', category: 'basic' },
  { word: 'running', expected: 'run-ning', category: 'basic' },
  { word: 'jumping', expected: 'jum-ping', category: 'basic' }
];

export async function runTests() {
  console.log('Running Syllabification V2 Tests...\n');
  
  let passed = 0;
  let failed = 0;
  const failedTests: Array<{test: TestCase, actual: string}> = [];
  
  // Group tests by category
  const categories = new Map<string, TestCase[]>();
  for (const test of TEST_CASES) {
    if (!categories.has(test.category)) {
      categories.set(test.category, []);
    }
    categories.get(test.category)!.push(test);
  }
  
  // Run tests by category
  for (const [category, tests] of categories) {
    console.log(`\n${category.toUpperCase()}:`);
    
    for (const test of tests) {
      try {
        const result = await breakWordIntoSyllablesV2(test.word);
        const actual = result.join('-');
        
        if (actual === test.expected) {
          console.log(`  ✓ ${test.word} → ${actual}`);
          passed++;
        } else {
          console.log(`  ✗ ${test.word} → ${actual} (expected: ${test.expected})`);
          failed++;
          failedTests.push({ test, actual });
        }
      } catch (error) {
        console.log(`  ✗ ${test.word} → ERROR: ${error}`);
        failed++;
        failedTests.push({ test, actual: 'ERROR' });
      }
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`TOTAL: ${passed + failed} tests`);
  console.log(`PASSED: ${passed} (${Math.round(passed / (passed + failed) * 100)}%)`);
  console.log(`FAILED: ${failed}`);
  
  if (failedTests.length > 0) {
    console.log('\nFAILED TESTS:');
    for (const { test, actual } of failedTests) {
      console.log(`  ${test.word}: ${actual} (expected: ${test.expected})`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  
  return { passed, failed, total: passed + failed };
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}