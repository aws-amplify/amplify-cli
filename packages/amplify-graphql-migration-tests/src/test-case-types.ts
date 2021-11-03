import { TransformerPluginProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { ITransformer } from 'graphql-transformer-core';

// Defines a single test input
export type TestEntry = {
  name: string;
  schema: string;
  v1TransformerConfig?: Partial<V1TransformerTestConfig>;
  v2TransformerConfig?: Partial<V2TransformerTestConfig>;
};

// If we need to vary other transformer config per test we can add additional parameters here
export type V1TransformerTestConfig = {
  transformers: ITransformer[];
};

// If we need to vary other transformer config per test we can add additional parameters here
export type V2TransformerTestConfig = {
  transformers: TransformerPluginProvider[];
};
