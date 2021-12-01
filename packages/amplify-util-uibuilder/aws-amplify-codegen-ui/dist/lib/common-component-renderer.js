"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonComponentRenderer = void 0;
const frontend_manager_node_1 = require("./frontend-manager-node");
const validation_helper_1 = require("./validation-helper");
/**
 * Shared class for rendering components.
 * Mostly contains helper functions for mapping the FrontendManager schema to actual props.
 */
class CommonComponentRenderer {
    constructor(component, parent) {
        this.component = component;
        this.parent = parent;
        // Run schema validation on the top-level component.
        if (this.parent === undefined) {
            validation_helper_1.validateComponentSchema(this.component);
        }
        const flattenedProps = Object.entries(component.properties).map((prop) => {
            return [prop[0], prop[1]];
        });
        this.inputProps = Object.fromEntries(flattenedProps);
        this.node = new frontend_manager_node_1.FrontendManagerNode(component, parent);
    }
}
exports.CommonComponentRenderer = CommonComponentRenderer;
//# sourceMappingURL=common-component-renderer.js.map