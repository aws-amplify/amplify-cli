import { $TSContext } from 'amplify-cli-core';
import { Constructor } from '.';
import { AmplifyTester, TestResult } from '../amplify_tester';

export function ContextMixin<TBase extends Constructor<AmplifyTester>>(Base: TBase, context: Partial<$TSContext> = {}) {
  return class TestVolume extends Base {
    private context: $TSContext;
    constructor(...args: any[]) {
      super(args);
      this.context = { ...({} as $TSContext), ...context };
      this.addResultProcessor(this.contextResultProcessor);
      this.addTestParameterCreator(this.testParameterCreator);
    }
    private testParameterCreator(options: Record<string, unknown>): Record<string, unknown> & { context: $TSContext } {
      return { context: this.context };
    }
    private contextResultProcessor<T>(result: TestResult<T>): TestResult<T> & { context: $TSContext } {
      return { ...result, context: this.context };
    }
  };
}
