const dgram = require('dgram');
const client = dgram.createSocket('udp4');

// Test syslog messages
const testMessages = [
  '<13>Jan 15 10:30:00 render-host render: Application started successfully',
  '<11>Jan 15 10:30:01 render-host render: Database connection established',
  '<14>Jan 15 10:30:02 render-host render: Health check passed',
  '<12>Jan 15 10:30:03 render-host render: User authentication successful',
  '<10>Jan 15 10:30:04 render-host render: API request processed',
  '<9>Jan 15 10:30:05 render-host render: WebSocket connection established',
  '<8>Jan 15 10:30:06 render-host render: Log streaming enabled',
  '<7>Jan 15 10:30:07 render-host render: Performance metrics collected'
];

const host = 'localhost';
const port = 514;

console.log(`Testing syslog server at ${host}:${port}`);

let messageIndex = 0;

function sendNextMessage() {
  if (messageIndex >= testMessages.length) {
    console.log('All test messages sent');
    client.close();
    return;
  }

  const message = testMessages[messageIndex];
  const buffer = Buffer.from(message, 'utf8');

  client.send(buffer, port, host, (error) => {
    if (error) {
      console.error(`Error sending message ${messageIndex + 1}:`, error);
    } else {
      console.log(`Sent message ${messageIndex + 1}: ${message}`);
    }
    
    messageIndex++;
    
    // Send next message after 1 second
    setTimeout(sendNextMessage, 1000);
  });
}

// Start sending messages
sendNextMessage();

// Handle client errors
client.on('error', (error) => {
  console.error('Client error:', error);
  client.close();
}); 