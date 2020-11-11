const aws = require('./aws.js');
const configurationManager = require('../configuration-manager');

class SecretsManager {
    constructor(context, options = {}) {
        return (async () => {
            let cred = {};
            try {
                cred = await configurationManager.loadConfiguration(context);
            } catch (e) {
                // ignore missing config
            }
            this.context = context;
            
            this.secretsManager = new aws.SecretsManager({ ...cred, ...options });
            return this;
        })();
    }
}

module.exports = SecretsManager;