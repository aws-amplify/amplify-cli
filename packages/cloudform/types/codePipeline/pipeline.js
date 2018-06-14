"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class InputArtifact {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.InputArtifact = InputArtifact;
class ActionDeclaration {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.ActionDeclaration = ActionDeclaration;
class StageDeclaration {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.StageDeclaration = StageDeclaration;
class BlockerDeclaration {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.BlockerDeclaration = BlockerDeclaration;
class StageTransition {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.StageTransition = StageTransition;
class ArtifactStore {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.ArtifactStore = ArtifactStore;
class ActionTypeId {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.ActionTypeId = ActionTypeId;
class OutputArtifact {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.OutputArtifact = OutputArtifact;
class EncryptionKey {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.EncryptionKey = EncryptionKey;
class Pipeline extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::CodePipeline::Pipeline', properties);
    }
}
Pipeline.InputArtifact = InputArtifact;
Pipeline.ActionDeclaration = ActionDeclaration;
Pipeline.StageDeclaration = StageDeclaration;
Pipeline.BlockerDeclaration = BlockerDeclaration;
Pipeline.StageTransition = StageTransition;
Pipeline.ArtifactStore = ArtifactStore;
Pipeline.ActionTypeId = ActionTypeId;
Pipeline.OutputArtifact = OutputArtifact;
Pipeline.EncryptionKey = EncryptionKey;
exports.default = Pipeline;
