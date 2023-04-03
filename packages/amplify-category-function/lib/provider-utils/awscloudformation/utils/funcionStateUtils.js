"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFunctionPushed = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const constants_1 = require("../../../constants");
const isFunctionPushed = (functionName) => { var _a, _b; return ((_b = (_a = amplify_cli_core_1.stateManager.getCurrentMeta()) === null || _a === void 0 ? void 0 : _a[constants_1.categoryName]) === null || _b === void 0 ? void 0 : _b[functionName]) !== undefined; };
exports.isFunctionPushed = isFunctionPushed;
//# sourceMappingURL=funcionStateUtils.js.map