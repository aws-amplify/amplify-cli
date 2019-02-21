const { importProject } = require('../../lib/mobilehub-import');

module.exports = {
  name: 'import',
  run: async (context) => {
    await importProject(context);
  },
};
