import { IntrinsicFunction } from 'cloudform-types';
import { LayerParameters, LayerVersionCfnMetadata } from './layerParams';
export declare function generateLayerCfnObj(isNewVersion: boolean, parameters: LayerParameters, versionList?: LayerVersionCfnMetadata[]): {
    Outputs: {
        Arn: {
            Value: IntrinsicFunction;
        };
    };
    AWSTemplateFormatVersion: string;
    Description: string;
    Parameters: {
        env: {
            Type: string;
        };
        deploymentBucketName: {
            Type: string;
        };
        s3Key: {
            Type: string;
        };
        description: {
            Type: string;
            Default: string;
        };
        runtimes: any;
    };
    Resources: {};
};
//# sourceMappingURL=lambda-layer-cloudformation-template.d.ts.map