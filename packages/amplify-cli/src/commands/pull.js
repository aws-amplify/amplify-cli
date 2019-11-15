const fs = require('fs-extra');

const { pullBackend } = require('../lib/pull-backend');
const { attachBackend } = require('../lib/attach-backend');

module.exports = {
  name: 'pull',
  run: async context => {
    const currentAmplifyMetaFilePath = context.amplify.pathManager.getCurrentAmplifyMetaFilePath(process.cwd());
    if (fs.existsSync(currentAmplifyMetaFilePath)) {
      await pullBackend(context);
    } else {
      await attachBackend(context);
    }
  },
};
