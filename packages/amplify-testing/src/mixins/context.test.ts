import { $TSContext } from 'amplify-cli-core';
import { AmplifyTester } from '../amplify_tester';
import ContextMixin from './context';

describe('Context mixin', () => {
  test('adds a context object to the test parameters', async () => {
    const context = { foo: 'bar' };
    const TestClass = ContextMixin(AmplifyTester, (context as unknown) as $TSContext);
    const tester = new TestClass();
    const result = await tester.runTest(parameters => Promise.resolve(parameters.context));
    expect(result.data).toEqual(context);
  });
});
