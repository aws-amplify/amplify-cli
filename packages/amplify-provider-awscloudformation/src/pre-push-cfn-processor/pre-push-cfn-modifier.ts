import Resource from 'cloudform-types/types/resource';
import _ from 'lodash';
import { applyS3SSEModification } from './modifiers/s3-sse-modifier';
import { Template } from 'cloudform-types';
import { iamRolePermissionsBoundaryModifier } from './modifiers/iam-role-permissions-boundary-modifier';

// modifies the template in-place
export type TemplateModifier = (template: Template) => Promise<void>;

export type ResourceModifier<T extends Resource> = (resource: T) => Promise<T>;

export const prePushCfnTemplateModifier: TemplateModifier = async template => {
  for (const [resourceName, resource] of Object.entries(template.Resources)) {
    const modifiers = getResourceModifiers(resource.Type);
    let mutatedResource = _.cloneDeep(resource);
    for (const modifier of modifiers) {
      mutatedResource = await modifier(mutatedResource);
    }
    template.Resources[resourceName] = mutatedResource;
  }
};

const getResourceModifiers = (type: string): ResourceModifier<Resource>[] => {
  return _.get(resourceTransformerRegistry, type, [identityResourceModifier]);
};

const resourceTransformerRegistry: Record<string, ResourceModifier<Resource>[]> = {
  'AWS::S3::Bucket': [applyS3SSEModification],
  'AWS::IAM::Role': [iamRolePermissionsBoundaryModifier],
};

const identityResourceModifier: ResourceModifier<Resource> = async resource => resource;
