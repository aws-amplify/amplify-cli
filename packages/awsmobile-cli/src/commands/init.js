const placeBase = require('../lib/init-steps/s0-placeBase'); 
const configSettings = require('../lib/init-steps/s1-configSettings'); 
const initProviders = require('../lib/init-steps/s2-initProviders'); 

module.exports = {
    name: 'init',
    run: async (context) => {
        placeBase.run(context)
        .then(configSettings.run)
        .then(initProviders.run); 
    }
}
  