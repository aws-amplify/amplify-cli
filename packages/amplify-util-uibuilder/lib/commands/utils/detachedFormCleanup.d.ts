import { StudioForm, StudioSchema } from '@aws-amplify/codegen-ui';
import { Form } from 'aws-sdk/clients/amplifyuibuilder';
import { AmplifyStudioClient } from '../../clients';
export declare const isFormDetachedFromModel: (formSchema: StudioForm | Form, modelNames: Set<string>) => boolean;
export declare const isFormSchemaCustomized: (formSchema: StudioForm | Form) => boolean;
export declare const isStudioForm: (schema: StudioSchema | undefined) => schema is StudioForm;
export declare const deleteDetachedForms: (detachedForms: {
    id: string;
    name: string;
}[], studioClient: AmplifyStudioClient) => Promise<void>;
//# sourceMappingURL=detachedFormCleanup.d.ts.map