const aws = require('./aws.js');
const configurationManager = require('../configuration-manager');
class Route53 {
    constructor(context, options = {}) {
        const instancePromise = (async () => {
            let cred = {};
            try {
                cred = await configurationManager.loadConfiguration(context);
            }
            catch (e) {
            }
            this.context = context;
            this.route53 = new aws.Route53({ ...cred, ...options });
            return this;
        })();
        return instancePromise;
    }
}
module.exports = Route53;
//# sourceMappingURL=aws-route53.js.map