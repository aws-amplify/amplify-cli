const configManager = require('../../configuration-manager');
module.exports = {
    name: 'configure',
    run: async (context) => configManager.configure(context),
};
//# sourceMappingURL=configure.js.map