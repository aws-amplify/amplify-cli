import { ServiceQuestionsResult } from '../service-walkthrough-types';
export declare const getResourceSynthesizer: (
  context: any,
  cfnFilename: string,
  provider: string,
) => (request: Readonly<ServiceQuestionsResult>) => Promise<Readonly<ServiceQuestionsResult>>;
export declare const getResourceUpdater: (
  context: any,
  cfnFilename: string,
  provider: string,
) => (request: ServiceQuestionsResult) => Promise<ServiceQuestionsResult>;
export declare const copyCfnTemplate: (context: any, category: string, options: any, cfnFilename: string) => Promise<any>;
export declare const saveResourceParameters: (
  context: any,
  providerName: string,
  category: string,
  resource: string,
  params: any,
  envSpecificParams?: any[],
) => void;
export declare const removeDeprecatedProps: (props: any) => any;
//# sourceMappingURL=synthesize-resources.d.ts.map
