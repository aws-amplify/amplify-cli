export type TestResult<T> = {
  data: T;
  [key: string]: unknown;
};

export type AmplifyTesterOptions = Record<string, unknown>;
export type AmplifyTestConfiguration = Record<string, unknown>;
export type TestParameterCreator = (options: AmplifyTesterOptions) => TestParameters;
export type TestParameters = Record<string, unknown>;
export type TestResultProcessor = <T>(result: TestResult<T>) => TestResult<T>;

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
    const result: TestResult<T> = { data };
    const processedResult = this.resultProcessors.reduce((result, processor) => processor(result) as TestResult<T>, result);
    return { ...processedResult, data };
  };
}
