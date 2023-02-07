export type TestResult<T> = {
  data: T;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
};

export type AmplifyTesterOptions = Record<string, unknown>;
export type AmplifyTestConfiguration = Record<string, unknown>;
export type TestParameterCreator = (options: AmplifyTesterOptions) => TestParameters;
export type TestParameters = Record<string, unknown>;
export type TestResultProcessor = (result: Record<string, unknown>) => Record<string, unknown>;

export class AmplifyTester {
  private resultProcessors: Array<TestResultProcessor> = [];
  protected addResultProcessor = (processor: TestResultProcessor) => {
    this.resultProcessors.push(processor);
  };
  private testParameterCreators: Array<TestParameterCreator> = [];
  protected addTestParameterCreator = (creator: TestParameterCreator) => {
    this.testParameterCreators.push(creator);
  };

  public runTest = async <T>(runner: (parameters: TestParameters) => Promise<T>): Promise<TestResult<T>> => {
    const parameters = this.testParameterCreators.reduce((parameters, creator) => ({ ...parameters, ...creator(parameters) }), {});
    const data = await runner(parameters);
    const processedResult = this.resultProcessors.reduce((result, processor) => processor(result) as Record<string, unknown>, {});
    return { outputs: processedResult, data, inputs: parameters };
  };
}
