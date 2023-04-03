import { $TSContext } from '..';
import { Template } from './amplify-base-cdk-types';
export declare abstract class AmplifyCategoryTransform {
    resourceName: string;
    constructor(resourceName: string);
    abstract transform(context: $TSContext): Promise<Template>;
    abstract applyOverride(): Promise<void>;
    abstract saveBuildFiles(context: $TSContext, template: Template): Promise<void>;
}
//# sourceMappingURL=category-override-base.d.ts.map