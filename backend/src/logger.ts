import path from 'node:path'
import pino, { Logger } from 'pino'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

const isProd = process.env.NODE_ENV === 'production'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const logsDir = path.join(__dirname, '..', 'logs')

function getLogFilename(base: string): string {
  const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  return path.join(logsDir, `${base}-${date}.log`)
}

function cleanOldLogs(basePattern: string) {
  const files = fs.readdirSync(logsDir)
  const now = Date.now()
  const maxAge = 90 * 24 * 60 * 60 * 1000

  files
    .filter((file) => file.startsWith(basePattern) && file.endsWith('.log'))
    .forEach((file) => {
      const filePath = path.join(logsDir, file)
      const stats = fs.statSync(filePath)
      if (now - stats.mtime.getTime() > maxAge) {
        fs.unlinkSync(filePath)
      }
    })
}

export async function initializeLogger(): Promise<{ logger: Logger }> {
  const baseConfig = {
    name: 'punchly-api',
    level: isProd ? 'info' : 'debug',

    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.body.password',
        'req.body.currentPassword',
        'req.body.passwordConfirmation',
        'req.body.newPassword',
        'req.body.token',
        'req.query.token',
        'password',
        'token',
        'secret',
        '*.password',
        '*.token',
        '*.secret',
        'user.password',
      ],
      remove: true,
    },

    base: {
      env: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
    },
  }

  let logger: Logger

  if (isProd) {
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true })
    }

    cleanOldLogs('app-')
    cleanOldLogs('error-')

    const appLogFile = getLogFilename('app')
    const errorLogFile = getLogFilename('error')

    const streams = [
      {
        level: 'info' as const,
        stream: pino.destination({
          dest: appLogFile,
          sync: false,
          mkdir: true,
        }),
      },
      {
        level: 'error' as const,
        stream: pino.destination({
          dest: errorLogFile,
          sync: false,
          mkdir: true,
        }),
      },
      {
        level: 'info' as const,
        stream: process.stdout,
      },
    ]

    logger = pino(
      {
        ...baseConfig,
        timestamp: pino.stdTimeFunctions.isoTime,
        formatters: {
          level: (label) => ({ level: label }),
        },
      },
      pino.multistream(streams)
    )
  } else {
    logger = pino({
      ...baseConfig,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
          singleLine: false,
          ignore: 'pid,hostname,name',
          messageFormat: '{msg}',
        },
      },
    })
  }

  return { logger }
}
