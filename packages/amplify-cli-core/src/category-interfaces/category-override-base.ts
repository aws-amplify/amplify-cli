import { $TSContext } from '..';
import { Template } from './amplify-base-cdk-types';

export abstract class AmplifyCategoryTransform {
  resourceName: string;
  constructor(resourceName: string) {
    this.resourceName = resourceName;
  }
  /**
   * Entry point for CFN transformation process for a category
   * @param context
   */
  abstract transform(context: $TSContext): Promise<Template>;
  /**
   * Apply overrides on the derviced class object
   */
  abstract applyOverride(): Promise<void>;
  /**
   * This function build and write  CFN files and parameters.json to disk
   * @param context amplify context
   * @param template Amplify generated CFN template
   */
  abstract saveBuildFiles(context: $TSContext, template: Template): Promise<void>;
}
