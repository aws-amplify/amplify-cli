import { AmplifyEvent } from './amplify-event';

export class PluginManifest {
  constructor(
    public name: string,
    public type: string,
    public displayName?: string,
    public aliases?: string[],
    public commands?: string[],
    public commandAliases?: {
      [key: string]: string;
    },
    public services?: string[],
    public eventHandlers?: AmplifyEvent[],
  ) {}
}
