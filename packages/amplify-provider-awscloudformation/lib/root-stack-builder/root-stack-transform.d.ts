import { $TSContext, Template } from 'amplify-cli-core';
import { AmplifyRootStack } from './root-stack-builder';
export declare class AmplifyRootStackTransform {
    private app;
    private _rootTemplateObj;
    private _synthesizer;
    private _synthesizerOutputs;
    private _rootTemplateObjOutputs;
    private _resourceName;
    constructor(resourceName: string);
    transform(context: $TSContext): Promise<Template>;
    private applyOverride;
    private generateRootStackTemplate;
    private synthesizeTemplates;
    private saveBuildFiles;
    getRootStack(): AmplifyRootStack;
}
//# sourceMappingURL=root-stack-transform.d.ts.map