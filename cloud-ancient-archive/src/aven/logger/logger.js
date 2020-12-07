let logLevel = process.env.AVEN_LOG_LEVEL || 'trace';

function logDebug(message, fields, level) {
  if (LOG_LEVEL_PRIORITY.indexOf(logLevel) <= LOG_LEVEL_PRIORITY.indexOf(level))
    console.log(`(${level}) - ${message}`, JSON.stringify(fields, null, 2));
}

export const LOG_LEVELS = {
  trace: 'TRACE',
  debug: 'DEBUG',
  log: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
  fatal: 'FATAL',
};

export const LOG_LEVEL_PRIORITY = [
  'trace',
  'debug',
  'log',
  'warn',
  'error',
  'fatal',
];

function logJSON(message, fields, level) {
  const logLine = JSON.stringify({
    ...fields,
    '@timestamp': new Date().toISOString(),
    '@message': message,
    '@version': 1,
    level: LOG_LEVELS[level],
  });
  console.log(logLine);
}

const LOGGERS = {
  json: logJSON,
  debug: logDebug,
};

let activeLogger = process.env.NODE_ENV === 'production' ? logJSON : logDebug;

export function setLoggerMode(mode) {
  if (!LOGGERS[mode]) {
    throw new Error(`No such logger "${mode}"`);
  }
  activeLogger = LOGGERS[mode];
}

export function setLogger(logger) {
  activeLogger = logger;
}

export function setLogLevel(level) {
  logLevel = level;
}

export function log(message, fields, level = 'log') {
  activeLogger(message, fields, level);
}

export function trace(message, fields) {
  return log(message, fields, 'trace');
}

export function debug(message, fields) {
  return log(message, fields, 'debug');
}

export function warn(message, fields) {
  return log(message, fields, 'warn');
}

export function error(message, fields) {
  return log(message, fields, 'error');
}

export function fatal(message, fields) {
  return log(message, fields, 'fatal');
}
