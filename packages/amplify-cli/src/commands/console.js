const pathManager = require('../extensions/amplify-helpers/path-manager');
module.exports = {
    name: 'console',
    run: async (context) => {
        const currentamplifyMetaFilePath = pathManager.getCurentBackendCloudamplifyMetaFilePath();
        const currentamplifyMeta = JSON.parse(fs.readFileSync(currentamplifyMetaFilePath));
    },
};
  