import { TransformerPluginProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { ITransformer } from 'graphql-transformer-core';

// Defines a single test input
type TestName = string;
type Schema = string;
export type TestEntry = [TestName, Schema, V1TransformerTestConfig?, V2TransformerTestConfig?];

// If we need to vary other transformer config per test we can add additional parameters here
export type V1TransformerTestConfig = {
  transformers: ITransformer[];
};

// If we need to vary other transformer config per test we can add additional parameters here
export type V2TransformerTestConfig = {
  transformers: TransformerPluginProvider[];
};
