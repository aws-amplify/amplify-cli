const analyzeProject = require('../lib/init-steps/s0-analyzeProject'); 
const configSettings = require('../lib/init-steps/s1-configSettings'); 
const initProviders = require('../lib/init-steps/s2-initProviders'); 
const onFailure = require('../lib/init-steps/s9-onFailure'); 
const onSuccess = require('../lib/init-steps/s9-onSuccess'); 

module.exports = {
    name: 'init',
    run: async (context) => {
        analyzeProject.run(context)
        .then(configSettings.run)
        .then(initProviders.run)
        .then(onSuccess.run)
        .catch(onFailure); 
        
    }
}
  