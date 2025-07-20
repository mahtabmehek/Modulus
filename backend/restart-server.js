const { exec } = require('child_process');

console.log('Stopping existing Node processes...');
exec('taskkill /F /IM node.exe', (error, stdout, stderr) => {
  console.log('Waiting 3 seconds...');
  setTimeout(() => {
    console.log('Starting server...');
    exec('npm start', { cwd: __dirname }, (error, stdout, stderr) => {
      if (error) {
        console.error('Error starting server:', error);
        return;
      }
      console.log('Server output:', stdout);
      if (stderr) console.error('Server stderr:', stderr);
    });
  }, 3000);
});
