"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIGateway = void 0;
const aws_js_1 = __importDefault(require("./aws.js"));
const configuration_manager_1 = require("../configuration-manager");
class APIGateway {
    static async getInstance(context, options = {}) {
        if (!APIGateway.instance) {
            let cred = {};
            try {
                cred = await (0, configuration_manager_1.loadConfiguration)(context);
            }
            catch (e) {
            }
            APIGateway.instance = new APIGateway(context, cred, options);
        }
        return APIGateway.instance;
    }
    constructor(context, creds, options = {}) {
        this.context = context;
        this.apigw = new aws_js_1.default.APIGateway({ ...creds, ...options });
    }
}
exports.APIGateway = APIGateway;
//# sourceMappingURL=aws-apigw.js.map