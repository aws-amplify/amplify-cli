const log = (message, level = 'log') => {
  if (process.env.VERBOSE_LOGGING) {
    console[level](message);
  }
};

const error = message => {
  log(message, 'error');
};

const warn = message => {
  log(message, 'warn');
};

const info = message => {
  log(message, 'info');
};

module.exports = {
  log,
  error,
  warn,
  info,
};
