import { CognitoConfiguration } from '../service-walkthrough-types/awsCognito-user-input-types';
import { ServiceQuestionHeadlessResult } from '../service-walkthrough-types/cognito-user-input-types';
import { AuthContext } from '../../../context';
export declare const getAddAuthHandler: (context: AuthContext) => (request: ServiceQuestionHeadlessResult | CognitoConfiguration) => Promise<string>;
export declare const getUpdateAuthHandler: (context: AuthContext) => (request: ServiceQuestionHeadlessResult | CognitoConfiguration) => Promise<string>;
//# sourceMappingURL=resource-handlers.d.ts.map