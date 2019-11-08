import { RawDocumentsConfig } from '@graphql-codegen/visitor-plugin-common';
import { directives } from './directives';
export type DirectiveMap = {
  [name: string]: string;
};

export interface AppSyncLocalPluginConfig extends RawDocumentsConfig {
  directives?: string;
}

export * from './plugin';
export * from './preset';

export const addToSchema = (config: AppSyncLocalPluginConfig) => {
  const result: string[] = [];
  if (config.scalars) {
    if (typeof config.scalars === 'string') {
      result.push(config.scalars);
    } else {
      result.push(...Object.keys(config.scalars).map(scalar => `scalar ${scalar}`));
    }
  }
  if (config.directives) {
    if (typeof config.directives === 'string') {
      result.push(config.directives);
    }
  }

  return result.join('\n');
};
