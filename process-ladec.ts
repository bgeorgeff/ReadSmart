
#!/usr/bin/env tsx

/**
 * Simple script to process LADEC CSV and update compound words
 */

import { processAndUpdateCompoundWords } from './server/utils/process-ladec-csv';
import path from 'path';

async function main() {
  const csvPath = path.join(__dirname, 'attached_assets', 'LADECv1-2019_1752110404130.csv');
  
  console.log('🔄 Processing LADEC compound words database...');
  console.log(`📁 CSV file: ${csvPath}`);
  console.log('');
  
  try {
    const result = await processAndUpdateCompoundWords(csvPath);
    
    if (result) {
      console.log('');
      console.log('✅ Processing completed successfully!');
      console.log('');
      console.log('📊 Summary:');
      console.log(`   • Your tested compounds: ${result.originalCount}`);
      console.log(`   • LADEC research database: ${result.ladecCount}`);
      console.log(`   • New compounds added: ${result.addedCount}`);
      console.log(`   • Final total: ${result.finalCount}`);
      console.log('');
      console.log('🔧 Your existing 833 compounds were preserved as "gold standard"');
      console.log('📄 Backup created: server/utils/syllable-v2/morphological.ts.backup');
      console.log('');
      console.log('🎯 Ready to test the expanded compound word database!');
    }
  } catch (error) {
    console.error('❌ Error processing LADEC data:', error);
    process.exit(1);
  }
}

main();
