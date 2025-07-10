const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Clearing Storybook cache...');

// Remove Storybook cache directories
const cacheDirs = [
  '.storybook-static',
  'node_modules/.cache',
  '.storybook-cache'
];

cacheDirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (fs.existsSync(fullPath)) {
    console.log(`Removing ${dir}...`);
    fs.rmSync(fullPath, { recursive: true, force: true });
  }
});

console.log('Reinstalling dependencies...');
try {
  execSync('npm install', { stdio: 'inherit', cwd: __dirname });
  console.log('Dependencies reinstalled successfully!');
} catch (error) {
  console.error('Error reinstalling dependencies:', error.message);
}

console.log('Cache cleared and dependencies reinstalled. You can now run: npm run storybook'); 