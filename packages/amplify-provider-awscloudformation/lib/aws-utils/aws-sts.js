"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.STS = void 0;
const aws_js_1 = __importDefault(require("./aws.js"));
const configuration_manager_1 = require("../configuration-manager");
class STS {
    static async getInstance(context, options = {}) {
        if (!STS.instance) {
            let cred = {};
            try {
                cred = await (0, configuration_manager_1.loadConfiguration)(context);
            }
            catch (e) {
            }
            STS.instance = new STS(context, cred, options);
        }
        return STS.instance;
    }
    constructor(context, cred, options = {}) {
        this.context = context;
        this.sts = new aws_js_1.default.STS({ ...cred, options });
    }
    async getCallerIdentity() {
        return await this.sts.getCallerIdentity().promise();
    }
}
exports.STS = STS;
//# sourceMappingURL=aws-sts.js.map