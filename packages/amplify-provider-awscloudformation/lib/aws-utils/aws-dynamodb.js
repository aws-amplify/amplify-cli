const aws = require('./aws.js');
const configurationManager = require('../configuration-manager');
class DynamoDB {
    constructor(context, options = {}) {
        return (async () => {
            let cred;
            try {
                cred = await configurationManager.loadConfiguration(context);
            }
            catch (e) {
            }
            this.context = context;
            this.dynamodb = new aws.DynamoDB({ ...cred, ...options });
            return this;
        })();
    }
}
module.exports = DynamoDB;
//# sourceMappingURL=aws-dynamodb.js.map