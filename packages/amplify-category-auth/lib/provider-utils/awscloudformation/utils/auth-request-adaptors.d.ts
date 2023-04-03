import { AddAuthRequest, UpdateAuthRequest } from 'amplify-headless-interface';
import { ServiceQuestionHeadlessResult } from '../service-walkthrough-types/cognito-user-input-types';
export type AddAuthRequestAdaptorFactory = (projectType: string) => AddAuthRequestAdaptor;
export type AddAuthRequestAdaptor = (request: AddAuthRequest) => ServiceQuestionHeadlessResult;
export declare const getAddAuthRequestAdaptor: AddAuthRequestAdaptorFactory;
export declare const getUpdateAuthRequestAdaptor: (projectType: string, requiredAttributes: string[]) => ({ serviceModification }: UpdateAuthRequest) => ServiceQuestionHeadlessResult;
//# sourceMappingURL=auth-request-adaptors.d.ts.map