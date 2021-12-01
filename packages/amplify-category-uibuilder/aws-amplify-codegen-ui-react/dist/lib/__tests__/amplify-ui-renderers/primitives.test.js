"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const snapshot_helpers_1 = require("../__utils__/snapshot-helpers");
const amplify_renderer_1 = require("../../amplify-ui-renderers/amplify-renderer");
const primitive_1 = __importDefault(require("../../primitive"));
function testPrimitive(component) {
    const renderedComponent = new amplify_renderer_1.AmplifyRenderer(component, {}).renderJsx(component);
    (0, snapshot_helpers_1.assertASTMatchesSnapshot)(renderedComponent);
}
describe('Primitives', () => {
    Object.values(primitive_1.default).forEach((primitive) => {
        test(primitive, () => {
            testPrimitive({
                componentType: primitive,
                name: `My${primitive}`,
                properties: {},
                bindingProperties: {},
            });
        });
    });
});
//# sourceMappingURL=primitives.test.js.map