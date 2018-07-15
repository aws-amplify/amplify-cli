const index = require('../../index'); 

module.exports = {
    name: 'add',
    alias: ['enable'],
    run: async (context) => {
        context.exeInfo = context.amplify.getProjectDetails(); 
        return index.add(context);
    }
};