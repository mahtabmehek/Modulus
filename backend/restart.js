// Simple script to kill and restart the server
const { spawn } = require('child_process');

console.log('Attempting to restart backend server...');

// Kill all node processes
const killProcess = spawn('taskkill', ['/F', '/IM', 'node.exe'], { shell: true });

killProcess.on('close', (code) => {
  console.log('Kill process exited with code:', code);
  
  // Wait a moment then start the server
  setTimeout(() => {
    console.log('Starting server...');
    const startProcess = spawn('npm', ['start'], { 
      cwd: __dirname,
      stdio: 'inherit',
      shell: true 
    });
    
    startProcess.on('error', (err) => {
      console.error('Error starting server:', err);
    });
  }, 2000);
});

killProcess.on('error', (err) => {
  console.error('Error killing processes:', err);
});
