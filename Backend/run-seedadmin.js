#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🌱 Running admin seed script...');
console.log('');

// Run the seedadmin.js file
const seedProcess = spawn('node', ['seedadmin.js'], {
  cwd: __dirname,
  stdio: 'inherit'
});

seedProcess.on('close', (code) => {
  if (code === 0) {
    console.log('');
    console.log('✅ Admin seeding completed successfully!');
  } else {
    console.log('');
    console.log('❌ Admin seeding failed with exit code:', code);
  }
});

seedProcess.on('error', (error) => {
  console.error('❌ Error running seed script:', error);
});
