import Resource from 'cloudform-types/types/resource';
import _ from 'lodash';
import { applyS3SSEModification } from './modifiers/s3-sse-modifier';
import { Template } from 'cloudform-types';

// modifies the template in-place
export type TemplateModifier = (template: Template) => Promise<void>;

// modifies the resource in-place
export type ResourceModifier = (resource: Resource) => Promise<void>;

export const prePushCfnTemplateModifier: TemplateModifier = async template => {
  await Promise.all(
    Object.values(template.Resources).map(async resource => {
      const transformers = getResourceModifiers(resource.Type);
      await Promise.all(transformers.map(transformer => transformer(resource)));
    }),
  );
};

const getResourceModifiers = (type: string) => {
  return _.get(resourceTransformerRegistry, type, [noopResourceTransformer]);
};

const resourceTransformerRegistry: Record<string, ResourceModifier[]> = {
  'AWS::S3::Bucket': [applyS3SSEModification],
};

const noopResourceTransformer: ResourceModifier = async () => {};
