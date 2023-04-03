"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSM = void 0;
const configuration_manager_1 = require("../configuration-manager");
const aws_js_1 = __importDefault(require("./aws.js"));
class SSM {
    static async getInstance(context, options = {}) {
        if (!SSM.instance) {
            let cred = {};
            try {
                cred = await (0, configuration_manager_1.loadConfiguration)(context);
            }
            catch (e) {
            }
            SSM.instance = new SSM(cred, options);
        }
        return SSM.instance;
    }
    constructor(cred, options = {}) {
        this.client = new aws_js_1.default.SSM({ ...cred, ...options });
    }
}
exports.SSM = SSM;
//# sourceMappingURL=aws-ssm.js.map