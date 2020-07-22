import { Sorter } from '@hapi/topo';
import { isPlainObject } from 'lodash';
import '../../CFNParser';
import { parseValue } from '../field-parser';
import { getResourceProcessorFor } from '../resource-processors';
import { CloudFormationParseContext } from '../types';
import {
  CloudFormationConditions,
  CloudFormationOutputs,
  CloudFormationParameters,
  CloudFormationResource,
  CloudFormationResources,
  CloudFormationTemplate,
  CloudFormationTemplateFetcher,
} from './types';

export const CFN_PSEUDO_PARAMS = {
  'AWS::Region': 'us-east-1-fake',
  'AWS::AccountId': '12345678910',
  'AWS::StackId': 'fake-stackId',
  'AWS::StackName': 'local-testing',
};

export function nestedStackHandler(
  resourceName: string,
  resource: CloudFormationResource,
  cfnContext: CloudFormationParseContext,
  cfnTemplateFetcher: CloudFormationTemplateFetcher,
) {
  if (typeof resource.Properties.TemplateURL === 'undefined') {
    throw new Error(`Error in parsing Nested stack ${resourceName}. Stack is missing required property TemplateURL`);
  }
  const parameters = resource.Properties.Parameters || {};

  // process all the parameters
  const processedParameters = Object.entries(parameters).reduce((acc, [parameterName, parameterValue]) => {
    return {
      ...acc,
      [parameterName]: parseValue(parameterValue, cfnContext),
    };
  }, {});

  // get the template
  const templatePath = parseValue(resource.Properties.TemplateURL, cfnContext);

  // custom templates have .json extension and Transformer generated ones don't.
  const stackTemplate = cfnTemplateFetcher.getCloudFormationStackTemplate(templatePath);

  if (typeof stackTemplate === 'undefined') {
    throw new Error(`Could not find the CloudFormation template ${templatePath} for resource ${resourceName}`);
  }

  return processCloudFormationStack(stackTemplate, processedParameters, cfnContext.exports, cfnTemplateFetcher);
}
export function mergeParameters(templateParameters: CloudFormationParameters, inputParameters): Record<string, any> {
  const processedParams: Record<string, any> = {};
  Object.keys(templateParameters).forEach((paramName: string) => {
    if (paramName in inputParameters) {
      processedParams[paramName] = inputParameters[paramName];
    } else if (typeof templateParameters[paramName].Default === 'undefined') {
      throw new Error(`CloudFormation stack parameter ${paramName} is missing default value`);
    } else {
      processedParams[paramName] = templateParameters[paramName].Default;
    }
  });
  return { ...CFN_PSEUDO_PARAMS, ...processedParams };
}

export function processConditions(conditions: CloudFormationConditions, processedParams: Record<string, any>): Record<string, boolean> {
  const processedConditions: Record<string, boolean> = {};
  Object.keys(conditions).forEach(conditionName => {
    const condition = conditions[conditionName];
    processedConditions[conditionName] = parseValue(condition, {
      params: processedParams,
      conditions: { ...conditions },
      resources: {},
      exports: {},
    });
  });
  return processedConditions;
}

export function getDependencyResources(node: object | any[], params: Record<string, any> = {}): string[] {
  let result: string[] = [];
  if (typeof node === 'string') {
    return [];
  }

  if (isPlainObject(node) && Object.keys(node).length === 1) {
    const fnName = Object.keys(node)[0];
    const fnArgs = node[fnName];
    if ('Ref' === fnName) {
      const resourceName = fnArgs;
      if (!Object.keys(params).includes(resourceName)) {
        result.push(resourceName);
      }
    } else if ('Fn::GetAtt' === fnName) {
      const resourceName = fnArgs[0];
      result.push(resourceName);
    } else if (typeof fnArgs !== 'string') {
      for (var i = 0; i < fnArgs.length; i++) {
        result = [...result, ...getDependencyResources(fnArgs[i], params)];
      }
    }
  } else if (Array.isArray(node)) {
    return node.reduce((acc, item) => [...acc, ...getDependencyResources(item, params)], []);
  }
  return result;
}

export function sortResources(resources: CloudFormationResources, params: Record<string, any>): string[] {
  const resourceSorter: Sorter<string> = new Sorter();
  Object.keys(resources).forEach(resourceName => {
    const resource = resources[resourceName];
    let dependsOn: string[] = [];
    // intrinsic dependency
    const intrinsicDependency = Object.values(resource.Properties)
      .map(propValue => getDependencyResources(propValue, params))
      .reduce((sum, val) => [...sum, ...val], []);

    // Todo: enable this once e2e test invoke transformer the same way as
    // mock
    // throw error if one of the intrinsic resource
    // const missingIntrinsicDeps = intrinsicDependency.filter(res => !(res in resources));
    // if (missingIntrinsicDeps.length) {
    //   throw new Error(
    //     `Resource ${resourceName} has missing intrinsic dependency ${
    //       missingIntrinsicDeps.length === 1 ? 'resource' : 'resources'
    //     } ${missingIntrinsicDeps.join(', ')}`,
    //   );
    // }

    if (resource.DependsOn) {
      if (Array.isArray(resource.DependsOn) || typeof resource.DependsOn === 'string') {
        dependsOn = typeof resource.DependsOn === 'string' ? [resource.DependsOn] : resource.DependsOn;
        if (dependsOn.some(dependsOnResource => !(dependsOnResource in resources))) {
          throw new Error(`Resource ${resourceName} DependsOn a non-existent resource`);
        }
      } else {
        throw new Error(`DependsOn block should be an array or a string for resource ${resourceName}`);
      }
    }
    try {
      resourceSorter.add(resourceName, { group: resourceName, after: [...dependsOn, ...intrinsicDependency] });
    } catch (e) {
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

export function filterResourcesBasedOnConditions(
  resources: CloudFormationResources,
  conditions: Record<string, boolean>,
): CloudFormationResources {
  const filteredResources: CloudFormationResources = {};
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

export function processResources(
  parameters: Record<string, any>,
  conditions: Record<string, boolean>,
  resources: CloudFormationResources,
  cfnExports: Record<string, any>,
  cfnTemplateFetcher: CloudFormationTemplateFetcher,
): { resources: Record<string, any>; stackExports: Record<string, any> } {
  const filteredResources = filterResourcesBasedOnConditions(resources, conditions);
  const sortedResourceNames = sortResources(filteredResources, parameters);
  const processedResources = {};
  sortedResourceNames.forEach(resourceName => {
    const resource = filteredResources[resourceName];
    const resourceType = resource.Type;
    const cfnContext: CloudFormationParseContext = {
      params: { ...parameters },
      conditions: { ...conditions },
      resources: { ...processedResources },
      exports: { ...cfnExports },
    };

    if (resourceType === 'AWS::CloudFormation::Stack') {
      const nestedStack = nestedStackHandler(resourceName, resource, cfnContext, cfnTemplateFetcher);
      processedResources[resourceName] = { result: nestedStack, Type: 'AWS::CloudFormation::Stack' };
      cfnExports = { ...cfnExports, ...nestedStack.stackExports };
    } else {
      try {
        const resourceProcessor = getResourceProcessorFor(resourceType);
        const processedResource = resourceProcessor(resourceName, resource, cfnContext);
        processedResources[resourceName] = { result: processedResource, Type: resourceType };
      } catch (e) {
        if (e.message.indexOf('No resource handler found') === -1) {
          // ignore errors when we don't know how to process the resource
          throw e;
        } else {
          console.log(
            `Mock does not handle CloudFormation resource of type ${resourceType}. Skipping processing resource ${resourceName}.`,
          );
        }
      }
    }
  });
  return { resources: processedResources, stackExports: cfnExports };
}

export function processOutputs(
  output: CloudFormationOutputs,
  parameters: Record<string, any>,
  conditions: Record<string, boolean>,
  resources: Record<string, any>,
  cfnExports: Record<string, any> = {},
): Record<string, any> {
  const stackExports = {};
  const cfnContext = { params: parameters, conditions, resources, exports: cfnExports };
  Object.values(output).forEach(output => {
    if (output.Export && output.Export.Name) {
      const exportName = parseValue(output.Export.Name, cfnContext);
      let exportValue;
      try {
        exportValue = parseValue(output.Value, cfnContext);
      } catch (e) {
        // when export section has conditional resource which is not provisioned, skip the export value
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

export function processCloudFormationStack(
  template: CloudFormationTemplate,
  parameters: Record<string, any>,
  cfnExports: Record<string, any>,
  cfnTemplateFetcher: CloudFormationTemplateFetcher,
): { resources: Record<string, any>; stackExports: Record<string, any> } {
  const mergedParameters = mergeParameters(template.Parameters || {}, parameters || {});
  const processedConditions = processConditions(template.Conditions || {}, mergedParameters);
  const processedResources = processResources(mergedParameters, processedConditions, template.Resources, cfnExports, cfnTemplateFetcher);
  const processedExports = processOutputs(
    template.Outputs || {},
    mergedParameters,
    processedConditions,
    processedResources.resources,
    processedResources.stackExports,
  );
  return {
    resources: processedResources.resources,
    stackExports: processedExports,
  };
}
