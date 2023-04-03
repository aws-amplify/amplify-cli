import { IPluginManifest } from '../types';
import { AmplifyEvent } from './amplify-event';
export declare class PluginManifest implements IPluginManifest {
    name: string;
    type: string;
    displayName?: string | undefined;
    aliases?: string[] | undefined;
    commands?: string[] | undefined;
    commandAliases?: {
        [key: string]: string;
    } | undefined;
    services?: string[] | undefined;
    eventHandlers?: AmplifyEvent[] | undefined;
    constructor(name: string, type: string, displayName?: string | undefined, aliases?: string[] | undefined, commands?: string[] | undefined, commandAliases?: {
        [key: string]: string;
    } | undefined, services?: string[] | undefined, eventHandlers?: AmplifyEvent[] | undefined);
}
//# sourceMappingURL=plugin-manifest.d.ts.map