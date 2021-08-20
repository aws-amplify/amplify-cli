import { Template } from 'cloudform-types';
export declare enum CommandType {
  'ADD' = 0,
  'UPDATE' = 1,
  'REMOVE' = 2,
}
export declare const authCognitoStackFileName: string;
export declare type AmplifyAuthStackConfig = {
  stackFileName: string;
};
export declare type ResourceConfig = {
  resourceName: string;
  categoryName: string;
  stackFileName: string;
};
export interface AmplifyAuthTransformOptions {
  resourceConfig: ResourceConfig;
  deploymentOptions: DeploymentOptions;
  overrideOptions?: OverrideOptions;
  cfnModifiers?: Function;
}
export interface DeploymentOptions {
  templateStack?: Template;
  rootFilePath: string;
}
export interface OverrideOptions {
  overrideFnPath: string;
  overrideDir: string;
}
export declare class AmplifyAuthTransform {
  private app;
  private _authTemplateObj;
  private _resourceConfig;
  private _authStackOptions;
  private _command;
  private _synthesizer;
  private _deploymentOptions;
  private _overrideProps;
  private _cfnModifiers;
  private _authInputState;
  constructor(options: AmplifyAuthTransformOptions, command: CommandType);
  transform(): Promise<Template>;
  generateResources(): void;
  private applyOverride;
  private getInput;
  private synthesizeTemplates;
  private deployOverrideStacksToDisk;
}
//# sourceMappingURL=auth-stack-transform.d.ts.map
