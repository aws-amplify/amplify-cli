const setupNewUser = require('../../setup-new-user');
module.exports = {
    name: 'setupNewUser',
    alias: ['setup-new-user', 'newUser', 'new-user'],
    run: async (context) => {
        await setupNewUser.run(context);
    },
};
//# sourceMappingURL=setupNewUser.js.map