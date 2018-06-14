import {List, Value} from "./dataTypes"

export interface CreationPolicy {
    AutoScalingCreationPolicy?: {
        MinSuccessfulInstancesPercent?: Value<number>
    },
    ResourceSignal?: {
        Count?: Value<number>
        Timeout?: Value<string>
    }
}

export enum DeletionPolicy {
    Delete = 'Delete',
    Retain = 'Retain',
    Snapshot = 'Snapshot'
}

export interface UpdatePolicy {
    AutoScalingReplacingUpdate?: {
        WillReplace?: Value<boolean>
    },
    AutoScalingRollingUpdate?: {
        MaxBatchSize?: Value<number>
        MinInstancesInService?: Value<number>
        MinSuccessfulInstancesPercent?: Value<number>
        PauseTime?: Value<string>
        SuspendProcesses?: List<string>,
        WaitOnResourceSignals?: Value<boolean>
    },
    AutoScalingScheduledAction?: {
        IgnoreUnmodifiedGroupSizeProperties?: Value<boolean>
    }
}

export default interface Resource {
    Type: string
    DependsOn?: Value<string> | List<string>
    Properties?: { [key: string]: any }
    Metadata?: { [key: string]: any }
    CreationPolicy?: CreationPolicy
    DeletionPolicy?: DeletionPolicy
    UpdatePolicy?: UpdatePolicy
    Condition?: Value<string>
}

export abstract class ResourceBase implements Resource {
    Type: string
    DependsOn?: Value<string> | List<string>
    Properties?: { [key: string]: any }
    Metadata?: { [key: string]: any }
    CreationPolicy?: CreationPolicy
    DeletionPolicy?: DeletionPolicy
    UpdatePolicy?: UpdatePolicy
    Condition?: Value<string>

    constructor(type: string, properties?: { [key: string]: any }) {
        this.Type = type
        this.Properties = properties
    }

    dependsOn(dependencies: Value<string> | List<string>) {
        this.DependsOn = dependencies
        return this
    }

    metadata(metadata: { [key: string]: any }) {
        this.Metadata = metadata
        return this
    }

    creationPolicy(policy: CreationPolicy) {
        this.CreationPolicy = policy
        return this
    }

    deletionPolicy(policy: DeletionPolicy) {
        this.DeletionPolicy = policy
        return this
    }

    updatePolicy(policy: UpdatePolicy) {
        this.UpdatePolicy = policy
        return this
    }

    condition(condition: Value<string>) {
        this.Condition = condition
        return this
    }
}

export class ResourceTag {
    constructor(public Key: Value<string>, public Value: Value<string>) {
    }
}