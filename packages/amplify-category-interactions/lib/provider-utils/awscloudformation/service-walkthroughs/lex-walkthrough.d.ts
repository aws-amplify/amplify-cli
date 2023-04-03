import { $TSAny, $TSContext, $TSMeta } from '@aws-amplify/amplify-cli-core';
import { LexSlot } from '../../supported-services';
type LexAnswers = {
    resourceName: string;
    botName: string;
    intentName?: string;
    outputVoice?: string;
    utterances?: string[];
    intents?: {
        intentName: string;
    }[];
    slots?: LexSlot[];
    newSlotTypes?: string[];
    coppa?: boolean;
    sessionTimeout?: number;
};
export declare const addWalkthrough: (context: $TSContext, defaultValuesFilename: string, serviceMetadata: string) => Promise<LexAnswers>;
export declare const updateWalkthrough: (context: $TSContext, defaultValuesFilename: string, serviceMetadata: $TSMeta) => Promise<LexAnswers>;
export declare const migrate: (context: $TSContext, projectPath: string, resourceName: string) => Promise<void>;
export declare const getIAMPolicies: (resourceName: string, crudOptions: string[]) => $TSAny;
export {};
//# sourceMappingURL=lex-walkthrough.d.ts.map