const { createLogger, format, transports } = require('winston');
const path = require('path');

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.json()
  ),
  defaultMeta: { service: 'corporate-ai' },
  transports: [
    // Console — colorized for development
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ timestamp, level, message, module, ...meta }) => {
          const mod = module ? `[${module}]` : '';
          const extra = Object.keys(meta).length > 1 ? ` ${JSON.stringify(meta)}` : '';
          return `${timestamp} ${level} ${mod} ${message}${extra}`;
        })
      ),
    }),
  ],
});

// File transports for production
if (process.env.NODE_ENV === 'production') {
  logger.add(new transports.File({
    filename: path.join(__dirname, '../../logs/error.log'),
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }));
  logger.add(new transports.File({
    filename: path.join(__dirname, '../../logs/combined.log'),
    maxsize: 5242880,
    maxFiles: 5,
  }));
}

module.exports = logger;
