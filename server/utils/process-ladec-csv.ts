
/**
 * LADEC CSV Processing Script
 * Converts LADEC compound word database to our V2 syllabification format
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface LADECEntry {
  id_master: string;
  c1: string;
  c2: string;
  stim: string;
  correctParse: string;
  // Add other fields as needed
}

/**
 * Parse CSV line into LADEC entry
 */
function parseCSVLine(line: string): LADECEntry | null {
  const columns = line.split(',');
  
  if (columns.length < 4) return null;
  
  return {
    id_master: columns[0],
    c1: columns[1],
    c2: columns[2], 
    stim: columns[3],
    correctParse: columns[11] // Column 12 in 0-indexed array
  };
}

/**
 * Process LADEC CSV file and extract compound words
 */
export function processLADECFile(csvFilePath: string): Map<string, string[]> {
  const compoundWords = new Map<string, string[]>();
  
  try {
    const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
    const lines = csvContent.split('\n');
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const entry = parseCSVLine(line);
      if (!entry) continue;
      
      // Only include entries marked as correct parses
      if (entry.correctParse === 'yes') {
        const compound = entry.stim.toLowerCase();
        const component1 = entry.c1.toLowerCase();
        const component2 = entry.c2.toLowerCase();
        
        // Basic validation
        if (compound && component1 && component2) {
          // Check if compound roughly equals component1 + component2
          const expectedLength = component1.length + component2.length;
          const actualLength = compound.length;
          
          // Allow for some variation in compound formation
          if (Math.abs(actualLength - expectedLength) <= 2) {
            compoundWords.set(compound, [component1, component2]);
          }
        }
      }
    }
    
    console.log(`Processed ${compoundWords.size} compound words from LADEC database`);
    return compoundWords;
    
  } catch (error) {
    console.error('Error processing LADEC file:', error);
    return new Map();
  }
}

/**
 * Check for duplicates between LADEC and existing compound words
 */
export function findDuplicates(
  ladecWords: Map<string, string[]>, 
  existingWords: Map<string, string[]>
): string[] {
  const duplicates: string[] = [];
  
  for (const [compound] of ladecWords) {
    if (existingWords.has(compound)) {
      duplicates.push(compound);
    }
  }
  
  return duplicates.sort();
}

/**
 * Merge LADEC data with existing compound words, preserving our tested entries
 */
export function mergeLADECWithExisting(
  ladecWords: Map<string, string[]>, 
  existingWords: Map<string, string[]>
): Map<string, string[]> {
  
  // Find duplicates first
  const duplicates = findDuplicates(ladecWords, existingWords);
  
  const mergedWords = new Map(existingWords); // Start with our tested entries
  let addedCount = 0;
  let skippedCount = 0;
  
  for (const [compound, components] of ladecWords) {
    if (!mergedWords.has(compound)) {
      mergedWords.set(compound, components);
      addedCount++;
    } else {
      skippedCount++;
      // Keep our existing entry as "gold standard"
    }
  }
  
  console.log(`Added ${addedCount} new compounds from LADEC`);
  console.log(`Skipped ${skippedCount} compounds (preserving existing entries)`);
  
  if (duplicates.length > 0) {
    console.log(`\n📋 Duplicate Detection Report:`);
    console.log(`Found ${duplicates.length} duplicates between your entries and LADEC:`);
    if (duplicates.length <= 20) {
      console.log(`   ${duplicates.join(', ')}`);
    } else {
      console.log(`   ${duplicates.slice(0, 20).join(', ')}... and ${duplicates.length - 20} more`);
    }
    console.log(`✅ Your original entries were preserved (kept as "gold standard")`);
  } else {
    console.log(`✅ No duplicates found - all LADEC entries are unique additions`);
  }
  
  console.log(`Total compound words: ${mergedWords.size}`);
  
  return mergedWords;
}

/**
 * Generate TypeScript Map format for morphological.ts
 */
export function generateCompoundWordsCode(compoundWords: Map<string, string[]>): string {
  const entries: string[] = [];
  
  // Sort entries alphabetically for better organization
  const sortedEntries = Array.from(compoundWords.entries()).sort();
  
  for (const [compound, components] of sortedEntries) {
    const componentsStr = components.map(c => `'${c}'`).join(', ');
    entries.push(`  ['${compound}', [${componentsStr}]],`);
  }
  
  return `// Compound words database (${compoundWords.size} entries)
// Merged from original 833 tested compounds + LADEC research database
export const COMPOUND_WORDS = new Map<string, string[]>([
${entries.join('\n')}
]);`;
}

/**
 * Main processing function
 */
export async function processAndUpdateCompoundWords(csvFilePath: string) {
  console.log('Processing LADEC CSV file...');
  
  // Process LADEC data
  const ladecWords = processLADECFile(csvFilePath);
  
  // Import existing compound words from morphological.ts
  const morphologicalPath = path.join(__dirname, 'syllable-v2', 'morphological.ts');
  const { COMPOUND_WORDS: existingWords } = await import('./syllable-v2/morphological');
  
  // Merge datasets
  const mergedWords = mergeLADECWithExisting(ladecWords, existingWords);
  
  // Generate new code
  const newCode = generateCompoundWordsCode(mergedWords);
  
  // Write backup of current file
  const backupPath = morphologicalPath + '.backup';
  fs.copyFileSync(morphologicalPath, backupPath);
  console.log(`Backup created: ${backupPath}`);
  
  // Read current file and replace COMPOUND_WORDS section
  const currentContent = fs.readFileSync(morphologicalPath, 'utf-8');
  
  // Find the start and end of the COMPOUND_WORDS Map
  const startPattern = /export const COMPOUND_WORDS = new Map<string, string\[\]>\(\[/;
  const endPattern = /\]\);/;
  
  const startMatch = currentContent.match(startPattern);
  if (!startMatch) {
    console.error('Could not find COMPOUND_WORDS in morphological.ts');
    return;
  }
  
  const startIndex = startMatch.index!;
  const afterStart = currentContent.substring(startIndex);
  const endMatch = afterStart.match(endPattern);
  
  if (!endMatch) {
    console.error('Could not find end of COMPOUND_WORDS in morphological.ts');
    return;
  }
  
  const endIndex = startIndex + endMatch.index! + endMatch[0].length;
  
  // Replace the COMPOUND_WORDS section
  const newContent = 
    currentContent.substring(0, startIndex) + 
    newCode + 
    currentContent.substring(endIndex);
  
  // Write updated file
  fs.writeFileSync(morphologicalPath, newContent);
  console.log('Updated morphological.ts with expanded compound words database');
  
  return {
    originalCount: existingWords.size,
    ladecCount: ladecWords.size,
    finalCount: mergedWords.size,
    addedCount: mergedWords.size - existingWords.size
  };
}

// Command line usage (ES module compatible)
const isMainModule = process.argv[1] && import.meta.url.includes(process.argv[1].split('/').pop() || '');
if (isMainModule) {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error('Usage: tsx process-ladec-csv.ts <path-to-csv-file>');
    process.exit(1);
  }
  
  processAndUpdateCompoundWords(csvPath)
    .then((result) => {
      if (result) {
        console.log('\n=== Processing Complete ===');
        console.log(`Original compounds: ${result.originalCount}`);
        console.log(`LADEC compounds: ${result.ladecCount}`);
        console.log(`Final total: ${result.finalCount}`);
        console.log(`Net added: ${result.addedCount}`);
      }
    })
    .catch(console.error);
}
