import {AmplifyEvent} from './amplify-event';

export default class PluginManifest {
    constructor(
        public name: string,
        public type: string,
        public commands: string[],
        public subscriptions?: AmplifyEvent[]) {
    }
}