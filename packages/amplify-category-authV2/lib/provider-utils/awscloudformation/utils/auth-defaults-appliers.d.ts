import { ServiceQuestionsResult } from '../service-walkthrough-types';
export declare const getAddAuthDefaultsApplier: (
  context: any,
  defaultValuesFilename: string,
  projectName: string,
) => (result: ServiceQuestionsResult) => Promise<ServiceQuestionsResult>;
export declare const getUpdateAuthDefaultsApplier: (
  context: any,
  defaultValuesFilename: string,
  previousResult: ServiceQuestionsResult,
) => (result: ServiceQuestionsResult) => Promise<ServiceQuestionsResult>;
//# sourceMappingURL=auth-defaults-appliers.d.ts.map
