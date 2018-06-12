
const placeBase = require('../lib/init-steps/s0-placeBase.js'); 

module.exports = {
    name: 'init',
    run: async (context) => {
        placeBase.run(context); 
    }
}
  