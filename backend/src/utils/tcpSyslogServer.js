const net = require('net');
const fs = require('fs');
const path = require('path');

class TCPSyslogServer {
  constructor(port = 514, logger = null) {
    this.port = port;
    this.logger = logger;
    this.server = null;
    this.isRunning = false;
    this.logsDir = path.join(__dirname, '..', '..', 'logs');
    
    // Ensure logs directory exists
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
    
    this.syslogFile = path.join(this.logsDir, 'syslog.log');
    this.renderLogsFile = path.join(this.logsDir, 'render-logs.log');
    this.tcpLogsFile = path.join(this.logsDir, 'tcp-syslog.log');
  }

  start() {
    return new Promise((resolve, reject) => {
      try {
        this.server = net.createServer((socket) => {
          this.handleConnection(socket);
        });
        
        this.server.on('error', (err) => {
          this.log('error', `TCP Syslog server error: ${err.message}`);
          reject(err);
        });

        this.server.on('listening', () => {
          const address = this.server.address();
          this.log('info', `TCP Syslog server listening on ${address.address}:${address.port}`);
          this.isRunning = true;
          resolve();
        });

        this.server.listen(this.port, '0.0.0.0');
        
      } catch (error) {
        this.log('error', `Failed to start TCP syslog server: ${error.message}`);
        reject(error);
      }
    });
  }

  stop() {
    return new Promise((resolve) => {
      if (this.server && this.isRunning) {
        this.server.close(() => {
          this.isRunning = false;
          this.log('info', 'TCP Syslog server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  handleConnection(socket) {
    const clientAddress = `${socket.remoteAddress}:${socket.remotePort}`;
    this.log('info', `TCP Syslog client connected: ${clientAddress}`);
    
    socket.on('data', (data) => {
      this.handleMessage(data, clientAddress);
    });
    
    socket.on('error', (err) => {
      this.log('error', `TCP Syslog client error (${clientAddress}): ${err.message}`);
    });
    
    socket.on('close', () => {
      this.log('info', `TCP Syslog client disconnected: ${clientAddress}`);
    });
  }

  handleMessage(data, clientAddress) {
    try {
      const message = data.toString('utf8').trim();
      if (!message) return;
      
      const timestamp = new Date().toISOString();
      
      // Parse syslog message (RFC 3164 format)
      const parsed = this.parseSyslogMessage(message);
      
      // Log to file
      const logEntry = {
        timestamp,
        clientAddress,
        originalMessage: message,
        parsed: parsed,
        protocol: 'TCP'
      };

      // Write to TCP syslog file
      fs.appendFileSync(this.tcpLogsFile, JSON.stringify(logEntry) + '\n');
      
      // Write to general syslog file
      fs.appendFileSync(this.syslogFile, JSON.stringify(logEntry) + '\n');
      
      // Write to render logs file if it looks like Render log
      if (this.isRenderLog(message)) {
        fs.appendFileSync(this.renderLogsFile, JSON.stringify(logEntry) + '\n');
      }

      // Log to main logger if available
      if (this.logger) {
        const level = this.getLogLevel(parsed.priority);
        this.logger[level](`[TCP-SYSLOG] ${parsed.message}`, {
          facility: parsed.facility,
          severity: parsed.severity,
          tag: parsed.tag,
          clientAddress: clientAddress
        });
      }

      // Console output for debugging
      console.log(`[TCP-SYSLOG] ${parsed.message} (from ${clientAddress})`);
      
    } catch (error) {
      this.log('error', `Failed to handle TCP syslog message: ${error.message}`);
    }
  }

  parseSyslogMessage(message) {
    // RFC 3164 syslog format: <PRI>TIMESTAMP HOST TAG: MESSAGE
    const regex = /^<(\d+)>([A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})\s+(\S+)\s+(\S+):\s*(.*)$/;
    const match = message.match(regex);
    
    if (match) {
      const priority = parseInt(match[1]);
      const timestamp = match[2];
      const host = match[3];
      const tag = match[4];
      const msg = match[5];
      
      const facility = Math.floor(priority / 8);
      const severity = priority % 8;
      
      return {
        priority,
        facility,
        severity,
        timestamp,
        host,
        tag,
        message: msg
      };
    }
    
    // If not in standard format, return as-is
    return {
      priority: 13, // Default: notice
      facility: 1,  // Default: user-level
      severity: 5,  // Default: notice
      timestamp: new Date().toISOString(),
      host: 'unknown',
      tag: 'unknown',
      message: message
    };
  }

  isRenderLog(message) {
    // Check if message contains Render-specific patterns
    const renderPatterns = [
      /render\.com/i,
      /onrender\.com/i,
      /render/i,
      /deploy/i,
      /build/i,
      /start/i,
      /stop/i,
      /restart/i,
      /health/i,
      /status/i
    ];
    
    return renderPatterns.some(pattern => pattern.test(message));
  }

  getLogLevel(priority) {
    const severity = priority % 8;
    
    switch (severity) {
      case 0: return 'emerg';
      case 1: return 'alert';
      case 2: return 'critical';
      case 3: return 'error';
      case 4: return 'warn';
      case 5: return 'info';
      case 6: return 'debug';
      default: return 'info';
    }
  }

  log(level, message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [TCP-SYSLOG-SERVER] [${level.toUpperCase()}] ${message}`;
    
    if (this.logger) {
      try {
        this.logger[level](message);
      } catch (error) {
        console.error(`[TCP-SYSLOG-SERVER] Logger error: ${error.message}`);
      }
    }
    
    // Always output to console for syslog server operations
    if (level === 'error') {
      console.error(logMessage);
    } else {
      console.log(logMessage);
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      port: this.port,
      logsDir: this.logsDir,
      syslogFile: this.syslogFile,
      renderLogsFile: this.renderLogsFile,
      tcpLogsFile: this.tcpLogsFile,
      protocol: 'TCP'
    };
  }

  getRecentLogs(limit = 100) {
    try {
      const logs = [];
      
      // Read TCP syslog file
      if (fs.existsSync(this.tcpLogsFile)) {
        const lines = fs.readFileSync(this.tcpLogsFile, 'utf8').split('\n').filter(line => line.trim());
        const recentLines = lines.slice(-limit);
        
        recentLines.forEach(line => {
          try {
            logs.push(JSON.parse(line));
          } catch (error) {
            this.log('error', `Failed to parse log line: ${error.message}`);
          }
        });
      }
      
      return logs;
    } catch (error) {
      this.log('error', `Failed to read recent logs: ${error.message}`);
      return [];
    }
  }

  getRenderLogs(limit = 100) {
    try {
      const logs = [];
      
      // Read render logs file
      if (fs.existsSync(this.renderLogsFile)) {
        const lines = fs.readFileSync(this.renderLogsFile, 'utf8').split('\n').filter(line => line.trim());
        const recentLines = lines.slice(-limit);
        
        recentLines.forEach(line => {
          try {
            logs.push(JSON.parse(line));
          } catch (error) {
            this.log('error', `Failed to parse render log line: ${error.message}`);
          }
        });
      }
      
      return logs;
    } catch (error) {
      this.log('error', `Failed to read render logs: ${error.message}`);
      return [];
    }
  }
}

module.exports = TCPSyslogServer; 