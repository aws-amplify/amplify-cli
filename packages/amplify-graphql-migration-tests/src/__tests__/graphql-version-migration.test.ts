import { getTestCaseRegistry } from '../test-case-registry';
import { v1transformerProvider } from '../v1-transformer-provider';
import { v2transformerProvider } from '../v2-transformer-provider';
import { migrateSchema } from '../migrate-schema-wrapper';
import { getNestedStackDiffRules } from '../nested-stack-diff-rules';
import * as cdkDiff from '@aws-cdk/cloudformation-diff';
import { ResourceImpact } from '@aws-cdk/cloudformation-diff';

describe('v1 to v2 migration', () => {
  test.concurrent.each(getTestCaseRegistry())(
    `validate $name schema migration`,
    async ({ name, schema, v1TransformerConfig, v2TransformerConfig }) => {
      console.log(name); // for some reason name substitution isn't working in the test title, so printing it here
      // run v1 transformer
      const v1Transformer = v1transformerProvider(v1TransformerConfig);
      const v1result = v1Transformer.transform(schema);

      // migrate schema from v1 to v2
      const migratedSchema = await migrateSchema(schema);

      // run v2 transformer
      const v2transformer = v2transformerProvider(v2TransformerConfig);
      const v2result = v2transformer.transform(migratedSchema);

      // get initial nested stack names
      // TODO will probably have to update the logic a bit if we want to test @searchable migrations here as that will create a SearchableStack that we need to account for
      const v1nestedStackNames = Object.keys(v1result.stacks).filter(stackName => stackName !== 'ConnectionStack'); // The v1 transformer puts all connection resolvers in a 'ConnectionStack'. This stack does not defined any data resources

      // verify root stack diff
      const diff = cdkDiff.diffTemplate(v1result.rootStack, v2result.rootStack);
      v1nestedStackNames.forEach(stackName => {
        expect([ResourceImpact.WILL_UPDATE, ResourceImpact.NO_CHANGE]).toContain(diff.resources.changes[stackName].changeImpact);
      });

      // verify nested stack diffs
      const nestedStackDiffRules = getNestedStackDiffRules();
      v1nestedStackNames.forEach(stackName => {
        const nestedStackDiff = cdkDiff.diffTemplate(v1result.stacks[stackName], v2result.stacks[stackName]);
        nestedStackDiffRules.forEach(rule => rule(stackName, nestedStackDiff));
      });
    },
  );
});
