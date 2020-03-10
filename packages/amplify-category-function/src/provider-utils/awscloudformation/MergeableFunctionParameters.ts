import { FunctionParameters, FunctionDependency, ProviderContext, FunctionTemplate, FunctionRuntime } from "amplify-function-plugin-interface";
import _ from "lodash";

/**
 * Implementation of FunctionParameters that can merge in other FunctionParameters objects in a non-destructive way.
 * Used throughout the lambda walkthrough by passing into and returning from methods and plugins that configure various parts of the function
 *
 * TODO: still working on exactly how this should be formatted because there is some legacy stuff that needs to be dealt with.
 */
export class MergeableFunctionParameters implements FunctionParameters {
  providerContext?: ProviderContext   // higher level context around the function
  cloudResourceTemplatePath?: string  // absolute path to the cloud resource template (for now this is always a CFN template)
  resourceName?: string               // name of this resource
  functionName?: string               // name of this function
  runtime?: FunctionRuntime           // runtime metadata for the function
  roleName?: string                   // IAM role that this function will assume
  dependsOn?: FunctionDependency[]    // resources this function depends on
  functionTemplate?: FunctionTemplate // fully describes the template that will be used
  categoryPolicies?: any              // IAM policies that should be applied to this lambda
  skipEdit?: boolean                  // Whether or not to prompt to edit the function after creation
  parametersFileObj?: any             // LEGACY contains the object that is written to function-parameters.json
  resourceProperties?: any            // LEGACY this is the existing env variable map. Migrate to use FunctionDependency
  topLevelComment?: string            // LEGACY
  trigger?: boolean | string          // LEGACY
  triggerTemplate?: string            // LEGACY
  triggerEventSourceMappings?: any    // LEGACY

  constructor(providerContext: ProviderContext) {
    this.providerContext = providerContext;
  }

  // performs a recursive merge that will append fields to objects and concatenate arrays, but not modify any existing values
  merge(other: FunctionParameters): MergeableFunctionParameters {
    const mergeFunc = (oldVal: any, newVal: any) => {
      if (!_.isObject(oldVal)) {
        return oldVal;
      }
      if (_.isArray(oldVal)) {
        return oldVal.concat(newVal);
      }
    }
    return _.mergeWith(this, other, mergeFunc);
  }
}