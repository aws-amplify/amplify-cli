import { AmplifyEvent } from './amplify-event';

export class PluginManifest {
  constructor(
    public name: string,
    public type: string,
    public aliases?: string[],
    public commands?: string[],
    public commandAliases?: {
      [key: string]: string;
    },
    public eventHandlers?: AmplifyEvent[]
  ) {}
}
