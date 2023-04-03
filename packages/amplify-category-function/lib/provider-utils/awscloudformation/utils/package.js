"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.packageResource = void 0;
const packageFunction_1 = require("./packageFunction");
const packageLayer_1 = require("./packageLayer");
const packageResource = async (context, resource, isExport) => getPackagerForService(resource.service)(context, resource, isExport);
exports.packageResource = packageResource;
const getPackagerForService = (service) => (service === "LambdaLayer" ? packageLayer_1.packageLayer : packageFunction_1.packageFunction);
//# sourceMappingURL=package.js.map