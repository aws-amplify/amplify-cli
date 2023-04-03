import { FunctionParameters } from '@aws-amplify/amplify-function-plugin-interface';
export declare function scheduleWalkthrough(context: any, params: Partial<FunctionParameters>, defaultConfirm?: boolean): Promise<Pick<FunctionParameters, 'cloudwatchRule'>>;
export declare function cronServiceWalkthrough(context: any): Promise<any>;
export declare function isValidCronExpression(cronExpression: string): boolean;
//# sourceMappingURL=scheduleWalkthrough.d.ts.map