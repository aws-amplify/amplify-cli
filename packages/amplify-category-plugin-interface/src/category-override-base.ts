import { $TSContext, $TSAny } from 'amplify-cli-core';
import { Template } from './amplifyBaseCDKTypes';

export abstract class AmplifyCategoryTransform {
  _resourceName: string;
  constructor(resourceName: string) {
    this._resourceName = resourceName;
  }

  abstract transform(context: $TSContext): Promise<Template>;
  abstract generateStackProps(context: $TSContext): $TSAny;
  abstract generateStackResources(props: $TSAny): Promise<void>;
  abstract synthesizeTemplates(): Promise<Template>;
  abstract applyOverride(): Promise<void>;
  abstract saveBuildFiles(template: Template): Promise<void>;
}
