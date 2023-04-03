const aws = require('./aws.js');
const configurationManager = require('../configuration-manager');
class SageMaker {
    constructor(context, options = {}) {
        return (async () => {
            let cred = {};
            try {
                cred = await configurationManager.loadConfiguration(context);
            }
            catch (e) {
            }
            this.context = context;
            this.sageMaker = new aws.SageMaker({ ...cred, ...options, apiVersion: '2017-07-24' });
            return this;
        })();
    }
}
module.exports = SageMaker;
//# sourceMappingURL=aws-sagemaker.js.map