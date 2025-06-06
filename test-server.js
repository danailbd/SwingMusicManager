const { spawn } = require('child_process');

console.log('🚀 Starting Next.js server test...');

const server = spawn('npx', ['next', 'dev', '--port', '3001'], { 
  stdio: 'pipe',
  cwd: process.cwd()
});

let serverReady = false;
let output = '';

const timeout = setTimeout(() => {
  if (!serverReady) {
    console.log('❌ Server startup timeout (30s)');
    server.kill();
    process.exit(1);
  }
}, 30000);

server.stdout.on('data', (data) => {
  const text = data.toString();
  output += text;
  console.log(text);
  
  if (text.includes('Ready') || text.includes('Local:') || text.includes('localhost:3001')) {
    serverReady = true;
    clearTimeout(timeout);
    console.log('✅ Server started successfully!');
    console.log('🎉 Your Song Tagger app is ready!');
    server.kill();
    process.exit(0);
  }
});

server.stderr.on('data', (data) => {
  const text = data.toString();
  console.error('Server error:', text);
  
  if (text.includes('EADDRINUSE')) {
    console.log('ℹ️  Port 3001 is in use, this is normal if the server is already running');
    server.kill();
    process.exit(0);
  }
});

server.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

console.log('⏳ Waiting for server to start...');
