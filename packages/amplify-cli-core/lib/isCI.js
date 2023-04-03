"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCI = void 0;
const ci_info_1 = __importDefault(require("ci-info"));
const isCI = () => {
    return ci_info_1.default.isCI;
};
exports.isCI = isCI;
//# sourceMappingURL=isCI.js.map