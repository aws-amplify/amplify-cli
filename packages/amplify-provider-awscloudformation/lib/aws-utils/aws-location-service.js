"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationService = void 0;
const configuration_manager_1 = require("../configuration-manager");
const aws_js_1 = __importDefault(require("./aws.js"));
class LocationService {
    static async getInstance(context, options = {}) {
        if (!LocationService.instance) {
            let cred = {};
            try {
                cred = await (0, configuration_manager_1.loadConfiguration)(context);
            }
            catch (e) {
            }
            LocationService.instance = new LocationService(cred, options);
        }
        return LocationService.instance;
    }
    constructor(cred, options = {}) {
        this.client = new aws_js_1.default.Location({ ...cred, ...options });
    }
}
exports.LocationService = LocationService;
//# sourceMappingURL=aws-location-service.js.map