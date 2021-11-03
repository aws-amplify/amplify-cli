'use strict';
import { GraphQLTransform } from '@aws-amplify/graphql-transformer-core';
import * as path from 'path';
import { PredictionsTransformer } from '..';

test('it generates resources with overrides', () => {
  const validSchema = `
    type Query {
      speakTranslatedIdentifiedText: String @predictions(actions: [identifyText translateText convertTextToSpeech])
      speakTranslatedLabelText: String @predictions(actions: [identifyLabels translateText convertTextToSpeech])
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new PredictionsTransformer({ bucketName: 'myStorage${hash}-${env}' })],
    overrideConfig: {
      overrideDir: path.join(__dirname, 'overrides'),
      overrideFlag: true,
      resourceName: 'myResource',
    },
  });

  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.stacks).toMatchSnapshot();
});
