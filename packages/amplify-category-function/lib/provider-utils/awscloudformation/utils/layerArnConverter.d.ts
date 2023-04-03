import { LambdaLayer, ProjectLayer } from '@aws-amplify/amplify-function-plugin-interface';
export declare const convertLambdaLayerMetaToLayerCFNArray: (input: LambdaLayer[], env: string) => (string | {
    'Fn::Sub': string;
} | {
    Ref: string;
})[];
export declare const convertProjectLayer: (layer: ProjectLayer, env?: string) => {
    'Fn::Sub': string;
    Ref?: undefined;
} | {
    Ref: string;
    'Fn::Sub'?: undefined;
};
//# sourceMappingURL=layerArnConverter.d.ts.map