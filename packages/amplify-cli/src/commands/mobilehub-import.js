const { importProject } = require('../lib/mobilehub-import');

module.exports = {
  name: 'mobilehub-import',
  run: async (context) => {
    await importProject(context);
  },
};
