const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Get today's date for log file name
const getLogFileName = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}.log`;
};

// Safe stringify object to handle circular references
const safeStringify = (obj) => {
  try {
    const cache = new Set();
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (cache.has(value)) {
          return '[Circular Reference]';
        }
        cache.add(value);
      }
      return value;
    }, 2);
  } catch (error) {
    return `[Error stringifying object: ${error.message}]`;
  }
};

// Log to file
const logToFile = (message, level = 'INFO') => {
  const timestamp = new Date().toISOString();
  const logFilePath = path.join(logsDir, getLogFileName());
  const logEntry = `[${timestamp}] [${level}] ${message}\n`;
  
  // Log to console as well
  console.log(`[${level}] ${message}`);
  
  // Append to file
  try {
    fs.appendFileSync(logFilePath, logEntry);
  } catch (err) {
    console.error(`Error writing to log file: ${err.message}`);
  }
};

// Logger object
const logger = {
  info: (message) => logToFile(message, 'INFO'),
  error: (message) => logToFile(message, 'ERROR'),
  warn: (message) => logToFile(message, 'WARN'),
  debug: (message) => logToFile(message, 'DEBUG'),
  
  // Log request details
  logRequest: (req) => {
    const { method, url, body, headers } = req;
    logger.info(`Request: ${method} ${url}`);
    
    try {
      if (headers) {
        // Redact sensitive headers
        const sanitizedHeaders = { ...headers };
        ['authorization', 'cookie', 'apikey'].forEach(key => {
          if (sanitizedHeaders[key]) sanitizedHeaders[key] = '[REDACTED]';
        });
        logger.debug(`Request headers: ${safeStringify(sanitizedHeaders)}`);
      }
      
      if (body && Object.keys(body).length > 0) {
        logger.debug(`Request body: ${safeStringify(body)}`);
      }
    } catch (err) {
      logger.error(`Error logging request: ${err.message}`);
    }
  },
  
  // Log response details
  logResponse: (res, data) => {
    try {
      logger.info(`Response: ${res.statusCode}`);
      
      if (data) {
        logger.debug(`Response data: ${safeStringify(data)}`);
      }
    } catch (err) {
      logger.error(`Error logging response: ${err.message}`);
    }
  },
  
  // Log error with detailed information
  logError: (error, context = '') => {
    try {
      logger.error(`${context ? context + ': ' : ''}${error.message}`);
      
      // Log error details if available
      if (error.code) logger.error(`Error code: ${error.code}`);
      if (error.statusCode) logger.error(`Status code: ${error.statusCode}`);
      if (error.stack) logger.error(`Stack trace: ${error.stack}`);
      
      // Log additional properties
      const errorProps = Object.getOwnPropertyNames(error).filter(
        prop => !['stack', 'message', 'code'].includes(prop)
      );
      
      if (errorProps.length > 0) {
        const details = {};
        errorProps.forEach(prop => { details[prop] = error[prop]; });
        logger.debug(`Additional error details: ${safeStringify(details)}`);
      }
    } catch (err) {
      logger.error(`Error while logging error: ${err.message}`);
    }
  }
};

module.exports = logger; 