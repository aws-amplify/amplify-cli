"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInfo = void 0;
const printer_1 = require("graphql/language/printer");
function createInfo(info) {
    const getSelectionSet = (nodes, prefix = null) => {
        return nodes.reduce((selectionSetList, node) => {
            if (node.kind == 'Field') {
                const aliasOrName = (node.alias || node.name).value;
                const name = prefix ? `${prefix}/${aliasOrName}` : aliasOrName;
                selectionSetList.push(name);
                if (node.selectionSet) {
                    selectionSetList.push(...getSelectionSet(node.selectionSet.selections, name));
                }
            }
            else if (node.kind === 'InlineFragment' || node.kind === 'FragmentSpread') {
                const fragment = node.kind === 'FragmentSpread' ? info.fragments[node.name.value] : node;
                if (fragment && fragment.selectionSet) {
                    selectionSetList.push(...getSelectionSet(fragment.selectionSet.selections, prefix));
                }
            }
            return selectionSetList;
        }, []);
    };
    let selectionSetGraphQL = '';
    let selectionSetList = [];
    const fieldNode = info.fieldNodes.find((f) => f.name.value === info.fieldName);
    if (fieldNode && fieldNode.selectionSet) {
        selectionSetGraphQL = (0, printer_1.print)(fieldNode.selectionSet);
        selectionSetList = getSelectionSet(fieldNode.selectionSet.selections);
    }
    return {
        fieldName: info.fieldName,
        variables: info.variableValues,
        parentTypeName: info.parentType,
        selectionSetList,
        selectionSetGraphQL,
    };
}
exports.createInfo = createInfo;
//# sourceMappingURL=info.js.map