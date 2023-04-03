import { StudioComponent, StudioTheme, GenericDataSchema, StudioForm, StudioSchema } from '@aws-amplify/codegen-ui';
import { ReactThemeStudioTemplateRendererOptions } from '@aws-amplify/codegen-ui-react';
import { $TSContext } from '@aws-amplify/amplify-cli-core';
export declare const createUiBuilderComponent: (context: $TSContext, schema: StudioComponent, dataSchema?: GenericDataSchema) => StudioComponent;
export declare const createUiBuilderTheme: (context: $TSContext, schema: StudioTheme, options?: ReactThemeStudioTemplateRendererOptions) => StudioTheme;
export declare const createUiBuilderForm: (context: $TSContext, schema: StudioForm, dataSchema?: GenericDataSchema) => StudioForm;
export declare const generateAmplifyUiBuilderIndexFile: (context: $TSContext, schemas: StudioSchema[]) => void;
type UtilFileChecks = {
    hasForms: boolean;
    hasViews: boolean;
};
export declare const generateAmplifyUiBuilderUtilFile: (context: $TSContext, { hasForms, hasViews }: UtilFileChecks) => void;
export declare const getAmplifyDataSchema: (context: $TSContext) => Promise<GenericDataSchema | undefined>;
export declare const generateBaseForms: (modelMap: {
    [model: string]: Set<"create" | "update">;
}) => StudioForm[];
export {};
//# sourceMappingURL=codegenResources.d.ts.map