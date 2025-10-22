import { Node, NodeArray } from 'typescript';
import { PolicyOverrides, ReferenceAuth } from '../generators/auth/index.js';
import { BucketAccelerateStatus, BucketVersioningStatus } from '@aws-sdk/client-s3';
import { AccessPatterns, ServerSideEncryptionConfiguration } from '../generators/storage/index.js';
import { UserPoolClientType } from '@aws-sdk/client-cognito-identity-provider';
export interface BackendRenderParameters {
    data?: {
        importFrom: string;
    };
    auth?: {
        importFrom: string;
        userPoolOverrides?: PolicyOverrides;
        guestLogin?: boolean;
        identityPoolName?: string;
        oAuthFlows?: string[];
        readAttributes?: string[];
        writeAttributes?: string[];
        referenceAuth?: ReferenceAuth;
        userPoolClient?: UserPoolClientType;
    };
    storage?: {
        importFrom: string;
        dynamoDB?: string;
        accelerateConfiguration?: BucketAccelerateStatus;
        versionConfiguration?: BucketVersioningStatus;
        hasS3Bucket?: string | AccessPatterns | undefined;
        bucketEncryptionAlgorithm?: ServerSideEncryptionConfiguration;
        bucketName?: string;
    };
    function?: {
        importFrom: string;
        functionNamesAndCategories: Map<string, string>;
    };
    customResources?: Map<string, string>;
    unsupportedCategories?: Map<string, string>;
}
export declare class BackendSynthesizer {
    private importDurationFlag;
    private oAuthFlag;
    private readWriteAttributeFlag;
    private supportedIdentityProviderFlag;
    private createPropertyAccessExpression;
    private createVariableDeclaration;
    private createVariableStatement;
    private createImportStatement;
    private defineBackendCall;
    private setPropertyValue;
    private getOverrideValue;
    private createBooleanPropertyAssignment;
    private createListPropertyAssignment;
    private createEnumListPropertyAssignment;
    private createNumericPropertyAssignment;
    private createDurationPropertyAssignment;
    private createStringPropertyAssignment;
    private createUserPoolClientAssignment;
    private createPropertyAccessChain;
    private getProviderSetupDeclaration;
    private getProviderSetupForeachStatement;
    private createProviderSetupCode;
    private createNestedObjectExpression;
    private createReadWriteAttributes;
    private mapOAuthScopes;
    private createOAuthObjectExpression;
    private createOAuthFlowsObjectExpression;
    private createAuthFlowsObjectExpression;
    private createTemplateLiteralExpression;
    private createAmplifyEnvNameLogic;
    render(renderArgs: BackendRenderParameters): NodeArray<Node>;
}
//# sourceMappingURL=synthesizer.d.ts.map