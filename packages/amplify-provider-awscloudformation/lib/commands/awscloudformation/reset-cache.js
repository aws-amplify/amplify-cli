const configManager = require('../../configuration-manager');
module.exports = {
    name: 'resetCache',
    alias: ['reset-cache'],
    run: async (context) => {
        await configManager.resetCache(context);
    },
};
//# sourceMappingURL=reset-cache.js.map