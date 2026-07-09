// ponytail: logger using Winston. Logs to console and to files inside user data.
import winston from 'winston'
import path from 'node:path'
import fs from 'node:fs'

let logger: winston.Logger | null = null

export function initLogger(userDataPath: string): winston.Logger {
  if (logger) return logger

  const logDir = path.join(userDataPath, 'logs')
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true })
  }

  logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
      }),
      new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
      }),
      new winston.transports.File({
        filename: path.join(logDir, 'combined.log'),
      }),
    ],
  })

  return logger
}

export function getLogger(): winston.Logger {
  if (!logger) {
    // Return a dummy logger before init
    return winston.createLogger({
      transports: [new winston.transports.Console()],
    })
  }
  return logger
}
