import { IndexTransformer, PrimaryKeyTransformer } from '@aws-amplify/graphql-index-transformer';
import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { GraphQLTransform } from '@aws-amplify/graphql-transformer-core';
import { AuthTransformer } from '..';
import { ACMTest, acmTests } from './acm-test-library';

describe('acm tests', () => {
  for (const [name, test] of Object.entries(acmTests)) {
    it(`ACM test '${name}' passes as expected`, () => {
      testSchemaACM(test);
    });
  }
});

const testSchemaACM = (test: ACMTest): void => {
  const authTransformer = new AuthTransformer();
  const transformer = new GraphQLTransform({
    authConfig: test.authConfig,
    transformers: [new ModelTransformer(), new IndexTransformer(), new PrimaryKeyTransformer(), authTransformer],
  });

  transformer.transform(test.sdl);

  for (const model of test.models) {
    const acm = (authTransformer as any).authModelConfig.get(model.name);
    expect(acm).toBeDefined();
    const resourceFields = acm.getResources();

    for (const validation of model.validations) {
      for (const [operation, fields] of Object.entries(validation.operations)) {
        const role = acm.getRolesPerOperation(operation).find(it => it === validation.roleType);
        expect(role || (!role && fields.length === 0)).toBeTruthy();

        if (role) {
          const allowedFields = resourceFields.filter((resource: any) => acm.isAllowed(role, resource, operation));
          expect(allowedFields).toEqual(fields);
        }
      }
    }
  }
};
