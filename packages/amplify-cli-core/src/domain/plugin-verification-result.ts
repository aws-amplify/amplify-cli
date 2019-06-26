import PluginManifest from './plugin-manifest';

export default class PluginVerificationResult {
    constructor(
        public verified: boolean = false,
        public manifest: PluginManifest | undefined = undefined,
        public packageJson: any = undefined
    ) {}
}