import Resource from 'cloudform-types/types/resource';
import _ from 'lodash';
import { applyS3SSEModification } from './modifiers/s3-sse-modifier';
import { Template } from 'cloudform-types';

// modifies the template in-place
export type TemplateModifier = (template: Template) => Promise<void>;

// modifies the resource in-place
export type ResourceModifier = (resource: Resource) => Promise<Resource>;

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

const getResourceModifiers = (type: string) => {
  return _.get(resourceTransformerRegistry, type, [identityResourceModifier]);
};

const resourceTransformerRegistry: Record<string, ResourceModifier[]> = {
  'AWS::S3::Bucket': [applyS3SSEModification],
};

const identityResourceModifier: ResourceModifier = async resource => resource;
