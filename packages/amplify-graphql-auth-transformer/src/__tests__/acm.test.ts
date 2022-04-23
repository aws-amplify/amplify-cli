import { IndexTransformer, PrimaryKeyTransformer } from '@aws-amplify/graphql-index-transformer';
import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { GraphQLTransform } from '@aws-amplify/graphql-transformer-core';
import { AuthTransformer } from '..';
import { ACMTest, acmTests } from './acm-test-library';
import { featureFlags } from './test-helpers';

jest.mock('amplify-prompts');

describe('acm tests', () => {
  Object.entries(acmTests).forEach(([name, test]) => {
    it(`ACM test '${name}' passes as expected`, () => {
      testSchemaACM(test);
    });
  });
});

const testSchemaACM = (test: ACMTest): void => {
  const authTransformer = new AuthTransformer();
  const transformer = new GraphQLTransform({
    authConfig: test.authConfig,
    transformers: [new ModelTransformer(), new IndexTransformer(), new PrimaryKeyTransformer(), authTransformer],
    featureFlags,
  });

  transformer.transform(test.sdl);

  test.models.forEach(model => {
    const acm = (authTransformer as any).authModelConfig.get(model.name);
    expect(acm).toBeDefined();
    const resourceFields = acm.getResources();

    model.validations.forEach(validation => {
      Object.entries(validation.operations).forEach(([operation, fields]) => {
        const role = acm.getRolesPerOperation(operation).find(it => it === validation.roleType);
        expect(role || (!role && fields.length === 0)).toBeTruthy();

        if (role) {
          const allowedFields = resourceFields.filter((resource: any) => acm.isAllowed(role, resource, operation));
          expect(allowedFields).toEqual(fields);
        }
      });
    });
  });
};
