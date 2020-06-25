import { Input } from './input';
import { AmplifyToolkit } from './amplify-toolkit';
import { PluginPlatform } from './plugin-platform';

export class Context {
  amplify: AmplifyToolkit;
  constructor(public pluginPlatform: PluginPlatform, public input: Input) {
    this.amplify = new AmplifyToolkit();
  }
  // ToDo: this is to attach gluegun extensions and other attached properties
  // already used by the plugins.
  // After the new platform is stablized, we probably should disallow arbituary
  // properties to be attached to the context object.
  [key: string]: any;
}
