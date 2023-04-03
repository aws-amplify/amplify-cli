"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.name = void 0;
const build_custom_resources_1 = require("../../utils/build-custom-resources");
exports.name = 'build';
async function run(context) {
    const { parameters } = context;
    const resourceName = parameters.first;
    await (0, build_custom_resources_1.buildCustomResources)(context, resourceName);
}
exports.run = run;
//# sourceMappingURL=build.js.map