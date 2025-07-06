const fs = require('fs');
const path = require('path');

const versions = {
  'free': 'render-free.yaml',
  'corrected-final': 'render-corrected-final.yaml',
  'correct': 'render-correct.yaml', 
  'no-db': 'render-no-db.yaml',
  'working': 'render-working.yaml',
  'final': 'render-final.yaml',
  'ultra-simple': 'render-ultra-simple.yaml',
  'minimal': 'render-minimal.yaml'
};

function switchVersion(versionName) {
  if (!versions[versionName]) {
    console.log('❌ Invalid version. Available versions:');
    Object.keys(versions).forEach(v => console.log(`  - ${v}`));
    return;
  }

  const sourceFile = versions[versionName];
  const targetFile = 'render.yaml';

  if (!fs.existsSync(sourceFile)) {
    console.log(`❌ Source file ${sourceFile} not found`);
    return;
  }

  try {
    fs.copyFileSync(sourceFile, targetFile);
    console.log(`✅ Switched to ${versionName} version`);
    console.log(`📁 ${sourceFile} → ${targetFile}`);
    
    // Show the current configuration
    const content = fs.readFileSync(targetFile, 'utf8');
    console.log('\n📋 Current render.yaml content:');
    console.log('─'.repeat(50));
    console.log(content);
    console.log('─'.repeat(50));
    
  } catch (error) {
    console.log(`❌ Error switching version: ${error.message}`);
  }
}

// Get version from command line argument
const version = process.argv[2];

if (!version) {
  console.log('🔧 Render.yaml Version Switcher');
  console.log('Usage: node switch-render-version.js <version>');
  console.log('\nAvailable versions:');
  Object.keys(versions).forEach(v => {
    const status = fs.existsSync(versions[v]) ? '✅' : '❌';
    console.log(`  ${status} ${v} (${versions[v]})`);
  });
  console.log('\nExamples:');
  console.log('  node switch-render-version.js free');
  console.log('  node switch-render-version.js corrected-final');
  console.log('  node switch-render-version.js no-db');
} else {
  switchVersion(version);
} 