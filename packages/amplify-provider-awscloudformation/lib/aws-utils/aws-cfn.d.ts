export = CloudFormation;
declare class CloudFormation {
    constructor(context: any, userAgentAction: any, options?: {}, eventMap?: {});
    pollQueue: any;
    pollQueueStacks: any[];
    stackEvents: any;
    cfn: any;
    context: any;
    eventMap: {};
    progressBar: import("@aws-amplify/amplify-prompts").MultiProgressBar;
    createResourceStack(cfnParentStackParams: any): Promise<any>;
    eventStartTime: Date;
    collectStackErrors(stackName: any): Promise<any>;
    generateFailedStackErrorMsgs(eventsWithFailure: any): any;
    filterFailedStackEvents(eventsWithFailure: any): any;
    readStackEvents(stackName: any): void;
    pollForEvents: NodeJS.Timeout;
    pollStack(stackName: any): any;
    addToPollQueue(stackId: any, priority?: number): boolean;
    removeFromPollQueue(stackId: any): void;
    showNewEvents(events: any): void;
    showEventProgress(events: any): void;
    getStackEvents(stackName: any): any;
    getStackParameters(stackName: any): any;
    updateResourceStack(filePath: any): Promise<any>;
    listStacks(nextToken: any, stackStatusFilter: any): Promise<any>;
    updateamplifyMetaFileWithStackOutputs(parentStackName: any): Promise<void>;
    listExports(nextToken?: any): Promise<any>;
    describeStack(cfnNestedStackParams: any, maxTry?: number, timeout?: number): Promise<any>;
    listStackResources(stackId: any): Promise<any>;
    deleteResourceStack(envName: any): Promise<any>;
}
//# sourceMappingURL=aws-cfn.d.ts.map