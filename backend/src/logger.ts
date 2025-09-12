import pino from 'pino'

const isProd = process.env.NODE_ENV === 'production'

export const logger = pino({
  name: 'punchly-api',
  level: process.env.LOG_LEVEL ?? (isProd ? 'info' : 'debug'),

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

  transport: !isProd
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
          singleLine: false,
          ignore: 'pid,hostname,name',
          messageFormat: '{msg}',
        },
      }
    : undefined,

  ...(isProd && {
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => ({ level: label }),
    },
  }),
})
