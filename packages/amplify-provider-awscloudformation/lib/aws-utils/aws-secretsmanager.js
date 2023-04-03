const aws = require('./aws.js');
const configurationManager = require('../configuration-manager');
class SecretsManager {
    constructor(context, options = {}) {
        const instancePromise = (async () => {
            let cred = {};
            try {
                cred = await configurationManager.loadConfiguration(context);
            }
            catch (e) {
            }
            this.context = context;
            this.secretsManager = new aws.SecretsManager({ ...cred, ...options });
            return this;
        })();
        return instancePromise;
    }
}
module.exports = SecretsManager;
//# sourceMappingURL=aws-secretsmanager.js.map