export interface CustomResource {
  name: string;
  path: string;
  cdkStackPath: string;
}

export interface ParsedStack {
  className: string;
  imports: string[];
  constructorBody: string;
  outputs: CfnOutput[];
  hasAmplifyHelpers: boolean;
  hasResourceDependency: boolean;
}

export interface CfnOutput {
  id: string;
  value: string;
  description?: string;
  exportName?: string;
}

export interface TransformResult {
  className: string;
  imports: string[];
  constructorBody: string;
  publicProperties: string[];
  outputs: CfnOutput[];
}

export interface GeneratedFiles {
  resourceFile: {
    path: string;
    content: string;
  };
  backendUpdates: {
    imports: string[];
    stackCreation: string;
    outputs: string;
  };
}
