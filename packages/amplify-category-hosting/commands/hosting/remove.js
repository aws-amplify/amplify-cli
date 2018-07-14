const index = require('../../index'); 

module.exports = {
    name: 'remove',
    alias: ['disable'],
    run: async (context) => {
        return index.remove(context);
    }
};