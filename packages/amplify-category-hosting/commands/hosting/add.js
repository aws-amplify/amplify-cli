const index = require('../../index'); 

module.exports = {
    name: 'add',
    alias: ['enable'],
    run: async (context) => {
        return index.add(context);
    }
};