export interface CDKConstruct {
  name: string;
  type: string;
  properties: Record<string, any>;
  outputs?: any[];
  subscriptions?: any[];
  resources?: any[];
  authorizers?: any[];
  targets?: any[];
  policies?: any[];
  notifications?: any[];
}

export interface CDKTable extends CDKConstruct {
  partitionKey: string;
  sortKey?: string;
  billingMode?: string;
}

export interface CDKS3 extends CDKConstruct {
  bucketName: string;
  versioned?: boolean;
  publicReadAccess?: boolean;
}

export interface CDKOutputs {
  forEach(callback: (output: CDKOutput) => void): void;
}

export interface CDKOutput {
  exportName: string;
  value: string;
  description?: string;
}

export interface AmplifyDependency {
  resourceName: string;
  property: string;
}
