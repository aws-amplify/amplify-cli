"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processCloudFormationStack = exports.processOutputs = exports.processExports = exports.processResources = exports.filterResourcesBasedOnConditions = exports.sortResources = exports.getDependencyResources = exports.processConditions = exports.mergeParameters = exports.nestedStackHandler = exports.CFN_PSEUDO_PARAMS = void 0;
const topo_1 = require("@hapi/topo");
const lodash_1 = require("lodash");
require("../../CFNParser");
const field_parser_1 = require("../field-parser");
const resource_processors_1 = require("../resource-processors");
exports.CFN_PSEUDO_PARAMS = {
    'AWS::Region': 'us-east-1-fake',
    'AWS::AccountId': '12345678910',
    'AWS::StackId': 'fake-stackId',
    'AWS::StackName': 'local-testing',
    'AWS::URLSuffix': 'amazonaws.com',
};
function nestedStackHandler(resourceName, resource, cfnContext, cfnTemplateFetcher) {
    if (typeof resource.Properties.TemplateURL === 'undefined') {
        throw new Error(`Error in parsing Nested stack ${resourceName}. Stack is missing required property TemplateURL`);
    }
    const parameters = resource.Properties.Parameters || {};
    const processedParameters = Object.entries(parameters).reduce((acc, [parameterName, parameterValue]) => {
        return {
            ...acc,
            [parameterName]: (0, field_parser_1.parseValue)(parameterValue, cfnContext),
        };
    }, {});
    const templatePath = (0, field_parser_1.parseValue)(resource.Properties.TemplateURL, cfnContext);
    const stackTemplate = cfnTemplateFetcher.getCloudFormationStackTemplate(templatePath);
    if (typeof stackTemplate === 'undefined') {
        throw new Error(`Could not find the CloudFormation template ${templatePath} for resource ${resourceName}`);
    }
    return processCloudFormationStack(stackTemplate, processedParameters, cfnContext.exports, cfnTemplateFetcher);
}
exports.nestedStackHandler = nestedStackHandler;
function mergeParameters(templateParameters, inputParameters) {
    const processedParams = {};
    Object.keys(templateParameters).forEach((paramName) => {
        if (paramName in inputParameters) {
            processedParams[paramName] = inputParameters[paramName];
        }
        else if (typeof templateParameters[paramName].Default === 'undefined') {
            throw new Error(`CloudFormation stack parameter ${paramName} is missing default value`);
        }
        else {
            processedParams[paramName] = templateParameters[paramName].Default;
        }
    });
    return { ...exports.CFN_PSEUDO_PARAMS, ...processedParams };
}
exports.mergeParameters = mergeParameters;
function processConditions(conditions, processedParams) {
    const processedConditions = {};
    Object.keys(conditions).forEach((conditionName) => {
        const condition = conditions[conditionName];
        processedConditions[conditionName] = (0, field_parser_1.parseValue)(condition, {
            params: processedParams,
            conditions: { ...conditions },
            resources: {},
            exports: {},
        });
    });
    return processedConditions;
}
exports.processConditions = processConditions;
function getDependencyResources(node, params = {}) {
    const result = [];
    if (typeof node === 'string') {
        return [];
    }
    if ((0, lodash_1.isPlainObject)(node)) {
        const nodeKeys = Object.keys(node);
        if (nodeKeys.length === 1) {
            const fnName = Object.keys(node)[0];
            const fnArgs = node[fnName];
            if ('Ref' === fnName) {
                const resourceName = fnArgs;
                if (!Object.keys(params).includes(resourceName)) {
                    result.push(resourceName);
                    return result;
                }
            }
            else if ('Fn::GetAtt' === fnName) {
                const resourceName = fnArgs[0];
                result.push(resourceName);
                return result;
            }
        }
        return nodeKeys.map((key) => getDependencyResources(node[key], params)).reduce((sum, val) => [...sum, ...val], []);
    }
    else if (Array.isArray(node)) {
        return node.reduce((acc, item) => [...acc, ...getDependencyResources(item, params)], []);
    }
    return result;
}
exports.getDependencyResources = getDependencyResources;
function sortResources(resources, params) {
    const resourceSorter = new topo_1.Sorter();
    Object.keys(resources).forEach((resourceName) => {
        const resource = resources[resourceName];
        let dependsOn = [];
        const intrinsicDependency = Object.values(resource.Properties)
            .map((propValue) => getDependencyResources(propValue, params))
            .reduce((sum, val) => [...sum, ...val], []);
        if (resource.DependsOn) {
            if (Array.isArray(resource.DependsOn) || typeof resource.DependsOn === 'string') {
                dependsOn = typeof resource.DependsOn === 'string' ? [resource.DependsOn] : resource.DependsOn;
                if (dependsOn.some((dependsOnResource) => !(dependsOnResource in resources))) {
                    throw new Error(`Resource ${resourceName} DependsOn a non-existent resource`);
                }
            }
            else {
                throw new Error(`DependsOn block should be an array or a string for resource ${resourceName}`);
            }
        }
        try {
            resourceSorter.add(resourceName, { group: resourceName, after: [...dependsOn, ...intrinsicDependency] });
        }
        catch (e) {
            if (e.message.indexOf('Item cannot come after itself') !== -1) {
                throw new Error(`Resource ${resourceName} can not depend on itself`);
            }
            if (e.message.indexOf('created a dependencies error') !== -1) {
                throw new Error('Cyclic dependency detected in the Resources');
            }
            throw e;
        }
    });
    return resourceSorter.nodes;
}
exports.sortResources = sortResources;
function filterResourcesBasedOnConditions(resources, conditions) {
    const filteredResources = {};
    Object.entries(resources)
        .filter(([resourceName, resource]) => {
        if (resource.Condition) {
            const condition = conditions[resource.Condition];
            if (typeof condition === 'undefined') {
                throw new Error(`Condition ${resource.Condition} used by resource ${resourceName} is not defined in Condition block`);
            }
            return condition;
        }
        return true;
    })
        .forEach(([resourceName, resource]) => {
        filteredResources[resourceName] = resource;
    });
    return filteredResources;
}
exports.filterResourcesBasedOnConditions = filterResourcesBasedOnConditions;
function processResources(parameters, conditions, resources, cfnExports, cfnTemplateFetcher) {
    const filteredResources = filterResourcesBasedOnConditions(resources, conditions);
    const sortedResourceNames = sortResources(filteredResources, parameters);
    const processedResources = {};
    sortedResourceNames.forEach((resourceName) => {
        const resource = filteredResources[resourceName];
        const resourceType = resource.Type;
        const cfnContext = {
            params: { ...parameters },
            conditions: { ...conditions },
            resources: { ...processedResources },
            exports: { ...cfnExports },
        };
        if (resourceType === 'AWS::CloudFormation::Stack') {
            const nestedStack = nestedStackHandler(resourceName, resource, cfnContext, cfnTemplateFetcher);
            processedResources[resourceName] = { result: nestedStack, Type: 'AWS::CloudFormation::Stack' };
            cfnExports = { ...cfnExports, ...nestedStack.stackExports };
        }
        else {
            try {
                const resourceProcessor = (0, resource_processors_1.getResourceProcessorFor)(resourceType);
                const processedResource = resourceProcessor(resourceName, resource, cfnContext);
                processedResources[resourceName] = { result: processedResource, Type: resourceType };
            }
            catch (e) {
                if (e.message.indexOf('No resource handler found') === -1) {
                    throw e;
                }
                else {
                    console.log(`Mock does not handle CloudFormation resource of type ${resourceType}. Skipping processing resource ${resourceName}.`);
                }
            }
        }
    });
    return { resources: processedResources, stackExports: cfnExports };
}
exports.processResources = processResources;
function processExports(output, parameters, conditions, resources, cfnExports = {}) {
    const stackExports = {};
    const cfnContext = { params: parameters, conditions, resources, exports: cfnExports };
    Object.values(output).forEach((output) => {
        if (output.Export && output.Export.Name) {
            const exportName = (0, field_parser_1.parseValue)(output.Export.Name, cfnContext);
            let exportValue;
            try {
                exportValue = (0, field_parser_1.parseValue)(output.Value, cfnContext);
            }
            catch (e) {
                return;
            }
            if (exportName in cfnExports) {
                throw new Error(`export ${exportName} is already exported in a different stack.`);
            }
            stackExports[exportName] = exportValue;
        }
    });
    return stackExports;
}
exports.processExports = processExports;
function processOutputs(output, parameters, conditions, resources, cfnExports = {}) {
    const outputs = {};
    const cfnContext = { params: parameters, conditions, resources, exports: cfnExports };
    Object.entries(output).forEach(([name, res]) => {
        outputs[name] = (0, field_parser_1.parseValue)(res.Value, cfnContext);
    });
    return outputs;
}
exports.processOutputs = processOutputs;
function processCloudFormationStack(template, parameters, cfnExports, cfnTemplateFetcher) {
    const mergedParameters = mergeParameters(template.Parameters || {}, parameters || {});
    const processedConditions = processConditions(template.Conditions || {}, mergedParameters);
    const processedResources = processResources(mergedParameters, processedConditions, template.Resources, cfnExports, cfnTemplateFetcher);
    const processedOutput = processOutputs(template.Outputs || {}, mergedParameters, processedConditions, processedResources.resources, processedResources.stackExports);
    const processedExports = processExports(template.Outputs || {}, mergedParameters, processedConditions, processedResources.resources, processedResources.stackExports);
    return {
        resources: processedResources.resources,
        stackExports: processedExports,
        outputs: processedOutput,
    };
}
exports.processCloudFormationStack = processCloudFormationStack;
//# sourceMappingURL=index.js.map