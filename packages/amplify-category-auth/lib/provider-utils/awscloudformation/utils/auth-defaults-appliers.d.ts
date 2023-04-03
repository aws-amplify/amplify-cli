import { AuthContext } from '../../../context';
import { CognitoConfiguration } from '../service-walkthrough-types/awsCognito-user-input-types';
import { ServiceQuestionHeadlessResult } from '../service-walkthrough-types/cognito-user-input-types';
export declare const getAddAuthDefaultsApplier: (context: AuthContext, defaultValuesFilename: string, projectName: string) => (result: CognitoConfiguration | ServiceQuestionHeadlessResult) => Promise<CognitoConfiguration>;
export declare const getUpdateAuthDefaultsApplier: (context: AuthContext, defaultValuesFilename: string, previousResult: CognitoConfiguration) => (result: CognitoConfiguration | ServiceQuestionHeadlessResult) => Promise<CognitoConfiguration>;
//# sourceMappingURL=auth-defaults-appliers.d.ts.map