const { run } = require('../init');

const initRun = run;

module.exports = {
  name: 'add',
  run: async context => {
    initRun(context);
  },
};
