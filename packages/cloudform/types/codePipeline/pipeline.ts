/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class InputArtifact {
    Name: Value<string>

    constructor(properties: InputArtifact) {
        Object.assign(this, properties)
    }
}

export class ActionDeclaration {
    ActionTypeId: ActionTypeId
    Configuration?: any
    InputArtifacts?: List<InputArtifact>
    Name: Value<string>
    OutputArtifacts?: List<OutputArtifact>
    RoleArn?: Value<string>
    RunOrder?: Value<number>

    constructor(properties: ActionDeclaration) {
        Object.assign(this, properties)
    }
}

export class StageDeclaration {
    Actions: List<ActionDeclaration>
    Blockers?: List<BlockerDeclaration>
    Name: Value<string>

    constructor(properties: StageDeclaration) {
        Object.assign(this, properties)
    }
}

export class BlockerDeclaration {
    Name: Value<string>
    Type: Value<string>

    constructor(properties: BlockerDeclaration) {
        Object.assign(this, properties)
    }
}

export class StageTransition {
    Reason: Value<string>
    StageName: Value<string>

    constructor(properties: StageTransition) {
        Object.assign(this, properties)
    }
}

export class ArtifactStore {
    EncryptionKey?: EncryptionKey
    Location: Value<string>
    Type: Value<string>

    constructor(properties: ArtifactStore) {
        Object.assign(this, properties)
    }
}

export class ActionTypeId {
    Category: Value<string>
    Owner: Value<string>
    Provider: Value<string>
    Version: Value<string>

    constructor(properties: ActionTypeId) {
        Object.assign(this, properties)
    }
}

export class OutputArtifact {
    Name: Value<string>

    constructor(properties: OutputArtifact) {
        Object.assign(this, properties)
    }
}

export class EncryptionKey {
    Id: Value<string>
    Type: Value<string>

    constructor(properties: EncryptionKey) {
        Object.assign(this, properties)
    }
}

export interface PipelineProperties {
    ArtifactStore: ArtifactStore
    DisableInboundStageTransitions?: List<StageTransition>
    Name?: Value<string>
    RestartExecutionOnUpdate?: Value<boolean>
    RoleArn: Value<string>
    Stages: List<StageDeclaration>
}

export default class Pipeline extends ResourceBase {
    static InputArtifact = InputArtifact
    static ActionDeclaration = ActionDeclaration
    static StageDeclaration = StageDeclaration
    static BlockerDeclaration = BlockerDeclaration
    static StageTransition = StageTransition
    static ArtifactStore = ArtifactStore
    static ActionTypeId = ActionTypeId
    static OutputArtifact = OutputArtifact
    static EncryptionKey = EncryptionKey

    constructor(properties?: PipelineProperties) {
        super('AWS::CodePipeline::Pipeline', properties)
    }
}
