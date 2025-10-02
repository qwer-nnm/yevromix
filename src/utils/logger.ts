type LoggerFunction = (...args: unknown[]) => void;

interface Logger {
  debug: LoggerFunction;
  info: LoggerFunction;
  warn: LoggerFunction;
  error: LoggerFunction;
}

export const logger: Logger = {
  debug: (...args: unknown[]) => {
    if (__DEV__) {
      console.log('[DEBUG]', ...args);
    }
  },
  info: (...args: unknown[]) => console.log('[INFO]', ...args),
  warn: (...args: unknown[]) => console.warn('[WARN]', ...args),
  error: (...args: unknown[]) => console.error('[ERROR]', ...args),
};


