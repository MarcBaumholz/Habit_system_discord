#!/usr/bin/env node

/**
 * Test script to verify Docker setup is ready
 */

const fs = require('fs');
const path = require('path');

console.log('🐳 Testing Docker Setup...\n');

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function printStatus(message, status = 'info') {
  const color = status === 'success' ? colors.green : 
                status === 'error' ? colors.red : 
                status === 'warning' ? colors.yellow : colors.blue;
  console.log(`${color}[${status.toUpperCase()}]${colors.reset} ${message}`);
}

// Check required files
const requiredFiles = [
  'Dockerfile',
  'docker-compose.yml',
  '.dockerignore',
  'deploy.sh',
  'update-and-deploy.sh',
  'docker-commands.sh',
  '.env'
];

console.log('📁 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    printStatus(`${file} ✓`, 'success');
  } else {
    printStatus(`${file} ✗`, 'error');
    allFilesExist = false;
  }
});

console.log('');

// Check file permissions
console.log('🔐 Checking script permissions...');
const scripts = ['deploy.sh', 'update-and-deploy.sh', 'docker-commands.sh'];

scripts.forEach(script => {
  if (fs.existsSync(script)) {
    const stats = fs.statSync(script);
    const isExecutable = !!(stats.mode & parseInt('111', 8));
    if (isExecutable) {
      printStatus(`${script} is executable ✓`, 'success');
    } else {
      printStatus(`${script} is not executable ✗`, 'error');
      allFilesExist = false;
    }
  }
});

console.log('');

// Check package.json scripts
console.log('📦 Checking package.json scripts...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const dockerScripts = Object.keys(packageJson.scripts).filter(script => 
    script.startsWith('docker:')
  );
  
  if (dockerScripts.length > 0) {
    printStatus(`Found ${dockerScripts.length} Docker scripts ✓`, 'success');
    dockerScripts.forEach(script => {
      printStatus(`  ${script}`, 'info');
    });
  } else {
    printStatus('No Docker scripts found ✗', 'error');
    allFilesExist = false;
  }
} catch (error) {
  printStatus('Could not read package.json ✗', 'error');
  allFilesExist = false;
}

console.log('');

// Check build output
console.log('🏗️ Checking build output...');
if (fs.existsSync('dist') && fs.existsSync('dist/index.js')) {
  printStatus('Build output exists ✓', 'success');
} else {
  printStatus('Build output missing - run "npm run build" first', 'warning');
}

console.log('');

// Summary
console.log('📊 Docker Setup Summary');
console.log('======================');

if (allFilesExist) {
  printStatus('✅ Docker setup is ready!', 'success');
  console.log('');
  console.log('🚀 Ready to deploy:');
  console.log('   ./deploy.sh');
  console.log('');
  console.log('🔄 Ready to update and deploy:');
  console.log('   ./update-and-deploy.sh');
  console.log('');
  console.log('🛠️ Ready to manage container:');
  console.log('   ./docker-commands.sh help');
  console.log('');
  console.log('📋 Next steps:');
  console.log('1. Make sure Docker is running');
  console.log('2. Run: ./deploy.sh');
  console.log('3. Check your Discord log channel');
  console.log('4. Use ./docker-commands.sh for management');
} else {
  printStatus('❌ Docker setup has issues', 'error');
  console.log('');
  console.log('🔧 Please fix the issues above before deploying');
}

console.log('');
