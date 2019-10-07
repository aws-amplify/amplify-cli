const { migrateProject } = require('../lib/migrate-project');

module.exports = {
  name: 'migrate',
  run: async context => {
    await migrateProject(context);
  },
};
