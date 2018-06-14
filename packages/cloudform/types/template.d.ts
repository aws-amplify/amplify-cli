import Parameter from "./parameter";
import Resource from "./resource";
import { Condition } from "./dataTypes";
import Output from "./output";
export default interface Template {
    AWSTemplateFormatVersion?: string;
    Description?: string;
    Metadata?: {
        [key: string]: any;
    };
    Parameters?: {
        [key: string]: Parameter;
    };
    Mappings?: {
        [key: string]: {
            [key: string]: {
                [key: string]: string | number | string[];
            };
        };
    };
    Conditions?: {
        [key: string]: Condition;
    };
    Transform?: any;
    Resources?: {
        [key: string]: Resource;
    };
    Outputs?: {
        [key: string]: Output;
    };
}
