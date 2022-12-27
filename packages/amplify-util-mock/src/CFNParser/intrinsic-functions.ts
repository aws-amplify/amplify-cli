import { CloudFormationParseContext } from './types';
import { isPlainObject } from 'lodash';
import { importModelTableResolver } from './import-model-table-resolver';

export function cfnJoin(valNode: [string, string[]], { params, conditions, resources, exports }: CloudFormationParseContext, processValue) {
  if (!(Array.isArray(valNode) && valNode.length === 2 && Array.isArray(valNode[1]))) {
    throw new Error(`FN::Join expects an array with 2 elements instead got ${JSON.stringify(valNode)}`);
  }
  const delimiter = valNode[0];
  const items = valNode[1].map(item => processValue(item, { params, conditions, resources, exports }));
  return items.join(delimiter);
}

export function cfnSub(valNode, { params, conditions, resources, exports }: CloudFormationParseContext, processValue) {
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
  if (!isPlainObject(subs)) {
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

  const result = Object.entries(subValues).reduce((template, entry: any) => {
    const regExp = new RegExp(`\\$\\{${entry[0]}\\}`, 'g');
    return template.replace(regExp, entry[1]);
  }, strTemplate);
  return result;
}

function templateReplace(template: string, args: any = {}) {
  return template.replace(/\${(\w+)}/g, (a, v) => {
    if (v in args) return args[v];
    return a;
  });
}

export function cfnGetAtt(valNode, { resources }: CloudFormationParseContext, processValue) {
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
    } else {
      // todo: investigate handling more cases when ref is directly the resource name etx
      throw new Error(`Could not get attribute ${attributeName} from resource ${resourceName}`);
    }
  } else if (!selectedResource.result.cfnExposedAttributes) {
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

export function cfnSplit(valNode, { params, conditions, resources, exports }: CloudFormationParseContext, processValue) {
  if (!Array.isArray(valNode) && valNode.length !== 2) {
    throw new Error(`FN::Split expects an array with 2 elements instead got ${JSON.stringify(valNode)}`);
  }
  const delim: string = valNode[0];
  const str: string = processValue(valNode[1], {
    params,
    conditions,
    resources,
    exports,
  });
  return str.split(delim);
}

export function cfnRef(valNode, { params, resources }: CloudFormationParseContext, processValue) {
  let key;
  if (typeof valNode === 'string') {
    key = valNode;
  } else if (Array.isArray(valNode) && valNode.length === 1) {
    key = processValue(valNode[0]);
  } else {
    throw new Error(`Ref expects a string or an array with 1 item. Instead got ${JSON.stringify(valNode)}`);
  }

  if (Object.prototype.hasOwnProperty.call(params, key)) {
    return params[key];
  }

  if (Object.keys(resources).includes(key)) {
    const result = resources[key]?.result ?? {};
    const refKey = Object.keys(result).find(k => k.toLowerCase() === 'ref');
    if (!refKey) {
      throw new Error(`Ref is missing in resource ${key}`);
    }
    return result[refKey];
  }
  console.warn(`Could not find ref for ${JSON.stringify(valNode)}. Using unsubstituted value.`);
  return key;
}

export function cfnSelect(valNode, parseContext: CloudFormationParseContext, processValue) {
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

export function cfnIf(valNode, { params, conditions, resources, exports }: CloudFormationParseContext, processValue) {
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

export function cfnEquals(valNode, { params, conditions, resources, exports }: CloudFormationParseContext, processValue) {
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

export function cfnNot(valNode, { params, conditions, resources, exports }: CloudFormationParseContext, processValue) {
  if (!Array.isArray(valNode) && valNode.length !== 1) {
    throw new Error(`FN::Not expects an array with  1 element instead got ${JSON.stringify(valNode)}`);
  }
  return !processValue(valNode[0], { params, conditions, resources, exports });
}

export function cfnAnd(valNode, { params, conditions, resources, exports }: CloudFormationParseContext, processValue) {
  if (!Array.isArray(valNode) && !(valNode.length >= 2 && valNode.length <= 10)) {
    throw new Error(`FN::And expects an array with  2-10 elements instead got ${JSON.stringify(valNode)}`);
  }
  return valNode.map(val => processValue(val, { params, conditions, resources, exports })).every(val => !!val);
}

export function cfnOr(valNode, { params, conditions, resources, exports }: CloudFormationParseContext, processValue) {
  if (!Array.isArray(valNode) && !(valNode.length >= 2 && valNode.length <= 10)) {
    throw new Error(`FN::And expects an array with  2-10 elements instead got ${JSON.stringify(valNode)}`);
  }
  return valNode.map(val => processValue(val, { params, conditions, resources, exports })).some(val => !!val);
}

export function cfnImportValue(valNode, { params, conditions, resources, exports }: CloudFormationParseContext, processValue) {
  if (!(isPlainObject(valNode) || typeof valNode === 'string')) {
    throw new Error(`FN::ImportValue expects an array with  1 elements instead got ${JSON.stringify(valNode)}`);
  }
  const key = processValue(valNode, { params, conditions, resources, exports });
  return exports[key] ?? importModelTableResolver(key, params.env);
}

export function cfnCondition(valNode, { conditions }: CloudFormationParseContext, processValue) {
  if (typeof valNode !== 'string') {
    throw new Error(`Condition should be a string value, instead got ${JSON.stringify(valNode)}`);
  }
  if (!(valNode in conditions)) {
    throw new Error(`Condition ${valNode} not present in conditions`);
  }
  return conditions[valNode];
}
