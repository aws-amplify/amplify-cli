import { CommandLineInput, InputOptions, IUsageDataPayload, ProjectSettings, TimedCodePath } from 'amplify-cli-core';
import { IFlowReport } from '@aws-amplify/amplify-cli-shared-interfaces';
import { SerializableError } from './SerializableError';
export declare class UsageDataPayload implements IUsageDataPayload {
    sessionUuid: string;
    installationUuid: string;
    amplifyCliVersion: string;
    input: CommandLineInput | null;
    inputOptions: CommandLineInput['options'];
    timestamp: string;
    error: SerializableError;
    downstreamException: SerializableError;
    payloadVersion: string;
    osPlatform: string;
    osRelease: string;
    nodeVersion: string;
    state: string;
    isCi: boolean;
    accountId: string;
    projectSetting: ProjectSettings;
    codePathDurations: Partial<Record<TimedCodePath, number>>;
    flowReport: IFlowReport;
    pushNormalizationFactor: number;
    constructor(sessionUuid: string, installationUuid: string, version: string, input: CommandLineInput, error: Error | null, state: string, accountId: string, project: ProjectSettings, inputOptions: InputOptions, codePathDurations: Partial<Record<TimedCodePath, number>>, flowReport: IFlowReport);
}
//# sourceMappingURL=UsageDataPayload.d.ts.map