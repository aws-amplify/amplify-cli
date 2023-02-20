import { $TSContext } from 'amplify-cli-core';
import { Constructor, MixinResult } from '.';
import { AmplifyTester } from '../amplify_tester';

export interface ContextMixin {
  withContext: (context: Partial<$TSContext>) => this;
}

export default function WithContext<TBase extends Constructor<AmplifyTester>>(
  Base: TBase,
  context: Partial<$TSContext> = {},
): MixinResult<ContextMixin, TBase> {
  return class AmplifyContextTester extends Base implements ContextMixin {
    _context: $TSContext;
    constructor(...args: any[]) {
      super(args);
      this._context = { ...({} as $TSContext), ...context };
      this.addResultProcessor(this._contextResultProcessor);
      this.addTestParameterCreator(this._testParameterCreator);
    }
    withContext = (context: Partial<$TSContext>) => {
      this._context = { ...this._context, ...context };
      return this;
    };
    _testParameterCreator = (options: Record<string, unknown>): Record<string, unknown> & { context: $TSContext } => {
      return { context: this._context };
    };
    _contextResultProcessor = (result: Record<string, unknown>): Record<string, unknown> & { context: $TSContext } => {
      return { context: this._context };
    };
  };
}
