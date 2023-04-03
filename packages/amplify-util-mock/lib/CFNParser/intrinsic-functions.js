"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cfnCondition = exports.cfnImportValue = exports.cfnOr = exports.cfnAnd = exports.cfnNot = exports.cfnEquals = exports.cfnIf = exports.cfnSelect = exports.cfnRef = exports.cfnSplit = exports.cfnGetAtt = exports.cfnSub = exports.cfnJoin = void 0;
const lodash_1 = require("lodash");
const import_model_table_resolver_1 = require("./import-model-table-resolver");
function cfnJoin(valNode, { params, conditions, resources, exports }, processValue) {
    if (!(Array.isArray(valNode) && valNode.length === 2 && Array.isArray(valNode[1]))) {
        throw new Error(`FN::Join expects an array with 2 elements instead got ${JSON.stringify(valNode)}`);
    }
    const delimiter = valNode[0];
    const items = valNode[1].map((item) => processValue(item, { params, conditions, resources, exports }));
    return items.join(delimiter);
}
exports.cfnJoin = cfnJoin;
function cfnSub(valNode, { params, conditions, resources, exports }, processValue) {
    if (typeof valNode === 'string') {
        return templateReplace(valNode, params);
    }
    if (!Array.isArray(valNode) && valNode.length !== 2) {
        throw new Error(`FN::Sub expects an array with 2 elements instead got ${JSON.stringify(valNode)}`);
    }
    const strTemplate = valNode[0];
    const subs = valNode[1];
    if (typeof strTemplate !== 'string') {
        throw new Error(`FN::Sub expects template to be an a string instead got ${JSON.stringify(strTemplate)}`);
    }
    if (!(0, lodash_1.isPlainObject)(subs)) {
        throw new Error(`FN::Sub expects substitution to be an object instead got ${JSON.stringify(subs)}`);
    }
    const subValues = {};
    Object.entries(subs).forEach(([key, value]) => {
        subValues[key] = processValue(value, {
            params,
            conditions,
            resources,
            exports,
        });
    });
    const result = Object.entries(subValues).reduce((template, entry) => {
        const regExp = new RegExp(`\\$\\{${entry[0]}\\}`, 'g');
        return template.replace(regExp, entry[1]);
    }, strTemplate);
    return result;
}
exports.cfnSub = cfnSub;
function templateReplace(template, args = {}) {
    return template.replace(/\${(\w+)}/g, (a, v) => {
        if (v in args)
            return args[v];
        return a;
    });
}
function cfnGetAtt(valNode, { resources }) {
    if (!Array.isArray(valNode) && valNode.length !== 2) {
        throw new Error(`FN::GetAtt expects an array with 2 elements instead got ${JSON.stringify(valNode)}`);
    }
    const resourceName = valNode[0];
    if (!Object.keys(resources).includes(resourceName)) {
        throw new Error(`Could not get resource ${valNode[0]}`);
    }
    const selectedResource = resources[resourceName];
    const attributeName = valNode[1];
    if (selectedResource.Type === 'AWS::CloudFormation::Stack') {
        const attrSplit = attributeName.split('.');
        if (attrSplit.length === 2 && attrSplit[0] === 'Outputs' && Object.keys(selectedResource.result.outputs).includes(attrSplit[1])) {
            return selectedResource.result.outputs[attrSplit[1]];
        }
        else {
            throw new Error(`Could not get attribute ${attributeName} from resource ${resourceName}`);
        }
    }
    else if (!selectedResource.result.cfnExposedAttributes) {
        throw new Error(`No attributes are exposed to Fn::GetAtt on resource type ${selectedResource.Type}`);
    }
    if (!Object.keys(selectedResource.result.cfnExposedAttributes).includes(attributeName)) {
        throw new Error(`Attribute ${attributeName} is not exposed to Fn::GetAtt on resource ${selectedResource.Type}`);
    }
    const effectiveAttrKey = selectedResource.result.cfnExposedAttributes[attributeName];
    if (!Object.keys(selectedResource.result).includes(effectiveAttrKey)) {
        throw new Error(`Could not get attribute ${attributeName} on resource ${resourceName}`);
    }
    return selectedResource.result[effectiveAttrKey];
}
exports.cfnGetAtt = cfnGetAtt;
function cfnSplit(valNode, { params, conditions, resources, exports }, processValue) {
    if (!Array.isArray(valNode) && valNode.length !== 2) {
        throw new Error(`FN::Split expects an array with 2 elements instead got ${JSON.stringify(valNode)}`);
    }
    const delimiter = valNode[0];
    const str = processValue(valNode[1], {
        params,
        conditions,
        resources,
        exports,
    });
    return str.split(delimiter);
}
exports.cfnSplit = cfnSplit;
function cfnRef(valNode, { params, resources }, processValue) {
    var _a, _b;
    let key;
    if (typeof valNode === 'string') {
        key = valNode;
    }
    else if (Array.isArray(valNode) && valNode.length === 1) {
        key = processValue(valNode[0]);
    }
    else {
        throw new Error(`Ref expects a string or an array with 1 item. Instead got ${JSON.stringify(valNode)}`);
    }
    if (Object.prototype.hasOwnProperty.call(params, key)) {
        return params[key];
    }
    if (Object.keys(resources).includes(key)) {
        const result = (_b = (_a = resources[key]) === null || _a === void 0 ? void 0 : _a.result) !== null && _b !== void 0 ? _b : {};
        const refKey = Object.keys(result).find((k) => k.toLowerCase() === 'ref');
        if (!refKey) {
            throw new Error(`Ref is missing in resource ${key}`);
        }
        return result[refKey];
    }
    console.warn(`Could not find ref for ${JSON.stringify(valNode)}. Using unsubstituted value.`);
    return key;
}
exports.cfnRef = cfnRef;
function cfnSelect(valNode, parseContext, processValue) {
    if (!Array.isArray(valNode) && valNode.length !== 2) {
        throw new Error(`FN::Select expects an array with 2 elements instead got ${JSON.stringify(valNode)}`);
    }
    const index = parseInt(valNode[0], 10);
    const selectionList = Array.isArray[valNode[1]] ? valNode[1] : processValue(valNode[1], parseContext);
    if (!Array.isArray(selectionList)) {
        throw new Error(`FN::Select expects list item to be an array instead got ${JSON.stringify(selectionList)}`);
    }
    if (index >= selectionList.length) {
        throw new Error(`FN::Select expects index to be less than or equal to the length of list: ${JSON.stringify(selectionList)}`);
    }
    return processValue(selectionList[index]);
}
exports.cfnSelect = cfnSelect;
function cfnIf(valNode, { params, conditions, resources, exports }, processValue) {
    if (!Array.isArray(valNode) && valNode.length !== 3) {
        throw new Error(`FN::If expects an array with  3 elements instead got ${JSON.stringify(valNode)}`);
    }
    const condition = conditions[valNode[0]];
    const result = condition ? valNode[1] : valNode[2];
    if (result.Ref && result.Ref === 'AWS::NoValue') {
        return undefined;
    }
    return processValue(result, { params, condition, resources, exports });
}
exports.cfnIf = cfnIf;
function cfnEquals(valNode, { params, conditions, resources, exports }, processValue) {
    if (!Array.isArray(valNode) && valNode.length !== 2) {
        throw new Error(`FN::Equal expects an array with  2 elements instead got ${JSON.stringify(valNode)}`);
    }
    const lhs = processValue(valNode[0], {
        params,
        conditions,
        resources,
        exports,
    });
    const rhs = processValue(valNode[1], {
        params,
        conditions,
        resources,
        exports,
    });
    return lhs == rhs;
}
exports.cfnEquals = cfnEquals;
function cfnNot(valNode, { params, conditions, resources, exports }, processValue) {
    if (!Array.isArray(valNode) && valNode.length !== 1) {
        throw new Error(`FN::Not expects an array with  1 element instead got ${JSON.stringify(valNode)}`);
    }
    return !processValue(valNode[0], { params, conditions, resources, exports });
}
exports.cfnNot = cfnNot;
function cfnAnd(valNode, { params, conditions, resources, exports }, processValue) {
    if (!Array.isArray(valNode) && !(valNode.length >= 2 && valNode.length <= 10)) {
        throw new Error(`FN::And expects an array with  2-10 elements instead got ${JSON.stringify(valNode)}`);
    }
    return valNode.map((val) => processValue(val, { params, conditions, resources, exports })).every((val) => !!val);
}
exports.cfnAnd = cfnAnd;
function cfnOr(valNode, { params, conditions, resources, exports }, processValue) {
    if (!Array.isArray(valNode) && !(valNode.length >= 2 && valNode.length <= 10)) {
        throw new Error(`FN::And expects an array with  2-10 elements instead got ${JSON.stringify(valNode)}`);
    }
    return valNode.map((val) => processValue(val, { params, conditions, resources, exports })).some((val) => !!val);
}
exports.cfnOr = cfnOr;
function cfnImportValue(valNode, { params, conditions, resources, exports }, processValue) {
    var _a;
    if (!((0, lodash_1.isPlainObject)(valNode) || typeof valNode === 'string')) {
        throw new Error(`FN::ImportValue expects an array with  1 elements instead got ${JSON.stringify(valNode)}`);
    }
    const key = processValue(valNode, { params, conditions, resources, exports });
    return (_a = exports[key]) !== null && _a !== void 0 ? _a : (0, import_model_table_resolver_1.importModelTableResolver)(key, params.env);
}
exports.cfnImportValue = cfnImportValue;
function cfnCondition(valNode, { conditions }) {
    if (typeof valNode !== 'string') {
        throw new Error(`Condition should be a string value, instead got ${JSON.stringify(valNode)}`);
    }
    if (!(valNode in conditions)) {
        throw new Error(`Condition ${valNode} not present in conditions`);
    }
    return conditions[valNode];
}
exports.cfnCondition = cfnCondition;
//# sourceMappingURL=intrinsic-functions.js.map