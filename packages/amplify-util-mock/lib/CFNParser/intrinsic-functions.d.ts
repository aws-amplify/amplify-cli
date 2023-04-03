import { CloudFormationParseContext } from './types';
export declare function cfnJoin(valNode: [string, string[]], { params, conditions, resources, exports }: CloudFormationParseContext, processValue: any): string;
export declare function cfnSub(valNode: any, { params, conditions, resources, exports }: CloudFormationParseContext, processValue: any): string;
export declare function cfnGetAtt(valNode: any, { resources }: CloudFormationParseContext): any;
export declare function cfnSplit(valNode: any, { params, conditions, resources, exports }: CloudFormationParseContext, processValue: any): string[];
export declare function cfnRef(valNode: any, { params, resources }: CloudFormationParseContext, processValue: any): any;
export declare function cfnSelect(valNode: any, parseContext: CloudFormationParseContext, processValue: any): any;
export declare function cfnIf(valNode: any, { params, conditions, resources, exports }: CloudFormationParseContext, processValue: any): any;
export declare function cfnEquals(valNode: any, { params, conditions, resources, exports }: CloudFormationParseContext, processValue: any): boolean;
export declare function cfnNot(valNode: any, { params, conditions, resources, exports }: CloudFormationParseContext, processValue: any): boolean;
export declare function cfnAnd(valNode: any, { params, conditions, resources, exports }: CloudFormationParseContext, processValue: any): any;
export declare function cfnOr(valNode: any, { params, conditions, resources, exports }: CloudFormationParseContext, processValue: any): any;
export declare function cfnImportValue(valNode: any, { params, conditions, resources, exports }: CloudFormationParseContext, processValue: any): string;
export declare function cfnCondition(valNode: any, { conditions }: CloudFormationParseContext): any;
//# sourceMappingURL=intrinsic-functions.d.ts.map