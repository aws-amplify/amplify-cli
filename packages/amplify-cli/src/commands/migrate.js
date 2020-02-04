const { migrateProject } = require('../migrate-project');

module.exports = {
  name: 'migrate',
  run: async context => {
    await migrateProject(context);
  },
};
