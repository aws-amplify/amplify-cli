"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IAMClient = void 0;
const aws_js_1 = __importDefault(require("./aws.js"));
const configuration_manager_1 = require("../configuration-manager");
class IAMClient {
    static async getInstance(context, options = {}) {
        if (!IAMClient.instance) {
            let cred;
            try {
                cred = await (0, configuration_manager_1.getAwsConfig)(context);
            }
            catch (e) {
            }
            IAMClient.instance = new IAMClient(cred, options);
        }
        return IAMClient.instance;
    }
    constructor(creds, options = {}) {
        this.client = new aws_js_1.default.IAM({ ...creds, ...options });
    }
}
exports.IAMClient = IAMClient;
//# sourceMappingURL=aws-iam.js.map