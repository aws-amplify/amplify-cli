"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SNS = void 0;
const configuration_manager_1 = require("../configuration-manager");
const aws_js_1 = __importDefault(require("./aws.js"));
const COGNITO_SMS_REGION_MAPPING = {
    'us-east-2': 'us-east-1',
    'ap-south-1': 'ap-southeast-1',
    'ap-northeast-2': 'ap-northeast-1',
    'ca-central-1': 'us-east-1',
    'eu-central-1': 'eu-west-1',
    'eu-west-2': 'eu-west-1',
};
class SNS {
    static async getInstance(context, options = {}) {
        if (!SNS.instance) {
            let cred = {};
            try {
                cred = await (0, configuration_manager_1.loadConfiguration)(context);
            }
            catch (e) {
            }
            if (Object.keys(COGNITO_SMS_REGION_MAPPING).includes(cred.region)) {
                cred.region = COGNITO_SMS_REGION_MAPPING[cred.region];
            }
            SNS.instance = new SNS(context, cred, options);
        }
        return SNS.instance;
    }
    constructor(context, cred, options = {}) {
        this.sns = new aws_js_1.default.SNS({ ...cred, ...options });
    }
    async isInSandboxMode() {
        const result = await this.sns.getSMSSandboxAccountStatus().promise();
        return result.IsInSandbox;
    }
}
exports.SNS = SNS;
//# sourceMappingURL=aws-sns.js.map