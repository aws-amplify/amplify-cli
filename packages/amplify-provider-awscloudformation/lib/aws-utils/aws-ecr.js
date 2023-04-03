"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const aws_1 = __importDefault(require("./aws"));
const configuration_manager_1 = require("../configuration-manager");
class ECR {
    constructor(context, options = {}) {
        this.context = context;
        const instancePromise = (async () => {
            let cred = {};
            try {
                cred = await (0, configuration_manager_1.loadConfiguration)(context);
            }
            catch (e) {
            }
            this.ecr = new aws_1.default.ECR({ ...cred, ...options });
            return this;
        })();
        return instancePromise;
    }
}
module.exports = ECR;
//# sourceMappingURL=aws-ecr.js.map