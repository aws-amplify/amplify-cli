import { AddAuthRequest, UpdateAuthRequest } from 'amplify-headless-interface';
import { ServiceQuestionsResult } from '../service-walkthrough-types';
export declare type AddAuthRequestAdaptorFactory = (projectType: string) => AddAuthRequestAdaptor;
export declare type AddAuthRequestAdaptor = (request: AddAuthRequest) => ServiceQuestionsResult;
export declare const getAddAuthRequestAdaptor: AddAuthRequestAdaptorFactory;
export declare const getUpdateAuthRequestAdaptor: (
  projectType: string,
  requiredAttributes: string[],
) => ({ serviceModification }: UpdateAuthRequest) => ServiceQuestionsResult;
//# sourceMappingURL=auth-request-adaptors.d.ts.map
