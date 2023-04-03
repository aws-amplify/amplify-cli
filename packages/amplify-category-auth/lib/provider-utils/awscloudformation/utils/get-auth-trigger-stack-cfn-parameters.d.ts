import { $TSContext } from '@aws-amplify/amplify-cli-core';
export declare const getAuthTriggerStackCfnParameters: (context: $TSContext, authResourceName: string) => Promise<AuthTriggerCfnTypes>;
export type AuthTriggerCfnTypes = {
    userpoolId: Record<'Fn::GetAtt', string[]>;
    userpoolArn: Record<'Fn::GetAtt', string[]>;
    snsRoleArn?: Record<'Fn::GetAtt', string[]>;
};
//# sourceMappingURL=get-auth-trigger-stack-cfn-parameters.d.ts.map