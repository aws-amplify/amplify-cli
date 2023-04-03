import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { StudioComponent, StudioTheme, GenericDataSchema, StudioForm, StudioSchema } from '@aws-amplify/codegen-ui';
type CodegenResponse<T extends StudioSchema> = {
    resultType: 'SUCCESS';
    schema: T;
    schemaName?: string;
} | {
    resultType: 'FAILURE';
    schemaName: string;
    error: Error;
    schema?: T;
};
export declare const generateUiBuilderComponents: (context: $TSContext, componentSchemas: any[], dataSchema?: GenericDataSchema) => CodegenResponse<StudioComponent>[];
export declare const generateUiBuilderThemes: (context: $TSContext, themeSchemas: any[]) => CodegenResponse<StudioTheme>[];
export declare const generateUiBuilderForms: (context: $TSContext, formSchemas: any[], dataSchema?: GenericDataSchema, autoGenerateForms?: boolean) => CodegenResponse<StudioForm>[];
export {};
//# sourceMappingURL=syncAmplifyUiBuilderComponents.d.ts.map