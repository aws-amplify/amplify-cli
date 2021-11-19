export interface TransformMigrationConfig {
  V1?: {
    Resources: string[];
  };
}

// Sync Config
export const enum ConflictHandlerType {
  OPTIMISTIC = 'OPTIMISTIC_CONCURRENCY',
  AUTOMERGE = 'AUTOMERGE',
  LAMBDA = 'LAMBDA',
}

export type ConflictDetectionType = 'VERSION' | 'NONE';
export type SyncConfigOptimistic = {
  ConflictDetection: ConflictDetectionType;
  ConflictHandler: ConflictHandlerType.OPTIMISTIC;
};
export type SyncConfigServer = {
  ConflictDetection: ConflictDetectionType;
  ConflictHandler: ConflictHandlerType.AUTOMERGE;
};
export type SyncConfigLambda = {
  ConflictDetection: ConflictDetectionType;
  ConflictHandler: ConflictHandlerType.LAMBDA;
  LambdaConflictHandler: LambdaConflictHandler;
};
export type LambdaConflictHandler = {
  name: string;
  region?: string;
  lambdaArn?: any;
};
export type SyncConfig = SyncConfigOptimistic | SyncConfigServer | SyncConfigLambda;

export type ResolverConfig = {
  project?: SyncConfig;
  models?: Record<string, SyncConfig>;
};
export interface TransformConfig {
  /**
   * The transform library uses a "StackMapping" to determine which stack
   * a particular resource belongs to. This "StackMapping" allows individual
   * transformer implementations to add resources to a single context and
   * reference resources as if they were all members of the same stack. The
   * transform formatter takes the single context and the stack mapping
   * and splits the context into a valid nested stack where any Fn::Ref or Fn::GetAtt
   * is replaced by a Import/Export or Parameter. Users may provide mapping
   * overrides to get specific behavior out of the transformer. Users may
   * override the default stack mapping to customize behavior.
   */
  StackMapping?: {
    [resourceId: string]: string;
  };

  /**
   * Provide build time options to GraphQL Transformer constructor functions.
   * Certain options cannot be configured via CloudFormation parameters and
   * need to be set at build time. E.G. DeletionPolicies cannot depend on parameters.
   */
  TransformerOptions?: {
    [transformer: string]: {
      [option: string]: any;
    };
  };
}
