"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildResource = void 0;
const buildFunction_1 = require("./buildFunction");
const buildLayer_1 = require("./buildLayer");
const buildResource = (context, resource) => {
    if (resource.service !== "Lambda" && resource.service !== "LambdaLayer") {
        return undefined;
    }
    return getBuilderForService(resource.service)(context, resource);
};
exports.buildResource = buildResource;
const getBuilderForService = (service) => (service === "LambdaLayer" ? buildLayer_1.buildLayer : buildFunction_1.buildFunction);
//# sourceMappingURL=build.js.map