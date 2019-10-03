const notificationManager = require('../../lib/notifications-manager');

module.exports = {
  name: 'status',
  alias: ['list', 'ls'],
  run: async context => {
    context.exeInfo = context.amplify.getProjectDetails();
    const enabledChannels = notificationManager.getEnabledChannels(context);
    const disableChannels = notificationManager.getDisabledChannels(context);

    const tableOptions = [['Channel', 'Status']];
    for (let i = 0; i < enabledChannels.length; i++) {
      tableOptions.push([enabledChannels[i], 'Enabled']);
    }
    for (let i = 0; i < disableChannels.length; i++) {
      tableOptions.push([disableChannels[i], 'Disabled']);
    }

    context.print.table(tableOptions, { format: 'markdown' });
  },
};
