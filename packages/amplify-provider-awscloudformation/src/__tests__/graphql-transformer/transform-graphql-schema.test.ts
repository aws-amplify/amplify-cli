import { SchemaLibrary } from '@aws-amplify/graphql-schema-test-library';
import { collectDirectives } from '@aws-amplify/graphql-transformer-core';
import { appsyncSubscriptionCheck } from '../../graphql-transformer/transform-graphql-schema';

describe('Transform graphql schema tests', () => {
  describe('Schema checks', () => {
    describe('Appsync Subscription Validation Checks', () => {
      it('Should allow a schema with 100 active subscriptions and some subscriptions nullified', () => {
        const directiveList = collectDirectives(SchemaLibrary.validSchema100Subscriptions);
        appsyncSubscriptionCheck(directiveList, "dummyLink");
      });
    });
  });
});
