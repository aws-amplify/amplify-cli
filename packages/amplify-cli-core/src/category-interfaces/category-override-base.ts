import { $TSContext } from '..';
import { Template } from './amplifyBaseCDKTypes';

export abstract class AmplifyCategoryTransform {
  _resourceName: string;
  constructor(resourceName: string) {
    this._resourceName = resourceName;
  }
  abstract transform(context: $TSContext): Promise<Template>;
  abstract applyOverride(): Promise<void>;
  abstract saveBuildFiles(context: $TSContext, template: Template): Promise<void>;
}
