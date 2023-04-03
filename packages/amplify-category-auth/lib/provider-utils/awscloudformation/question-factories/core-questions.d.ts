import { $TSAny } from '@aws-amplify/amplify-cli-core';
import { AuthContext } from '../../../context';
export type Input = {
    when?: () => boolean;
    prefixColor?: string;
    prefix?: string;
    key: string;
    question?: string;
    suffix?: string;
    map?: $TSAny;
    type?: string;
    iterator?: $TSAny;
    filter?: $TSAny;
    requiredOptions?: $TSAny;
    options?: $TSAny;
};
export declare const parseInputs: (input: Input, amplify: $TSAny, defaultValuesFilename: $TSAny, stringMapsFilename: $TSAny, currentAnswers: $TSAny, context: AuthContext) => Promise<$TSAny>;
//# sourceMappingURL=core-questions.d.ts.map