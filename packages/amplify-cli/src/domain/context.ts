/* eslint-disable import/no-cycle */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable spellcheck/spell-checker */
import { CommandLineInput, IPluginPlatform, IUsageData } from '@aws-amplify/amplify-cli-core';
import { AmplifyToolkit } from './amplify-toolkit';

/**
 * Amplify Context object to manage global state
 */
export class Context {
  amplify: AmplifyToolkit;
  usageData!: IUsageData;
  constructor(public pluginPlatform: IPluginPlatform, public input: CommandLineInput) {
    this.amplify = new AmplifyToolkit();
  }

  // ToDo: this is to attach gluegun extensions and other attached properties
  // already used by the plugins.
  // After the new platform is stablized, we probably should disallow arbituary
  // properties to be attached to the context object.
  [key: string]: any;
}
