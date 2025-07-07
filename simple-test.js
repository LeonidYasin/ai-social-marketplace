console.log('Testing server connection...');

const net = require('net');

const client = new net.Socket();

client.connect(8000, 'localhost', function() {
  console.log('✅ Connected to server on port 8000');
  client.destroy();
});

client.on('error', function(err) {
  console.log('❌ Connection failed:', err.message);
});

setTimeout(() => {
  console.log('Test completed');
  process.exit(0);
}, 2000); 