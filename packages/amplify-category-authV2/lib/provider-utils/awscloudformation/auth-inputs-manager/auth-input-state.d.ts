import { VersionUpgradePipeline } from 'amplify-util-headless-input';
import { ServiceQuestionsResult } from '../service-walkthrough-types';
export declare const noopUpgradePipeline: VersionUpgradePipeline;
export declare type AuthInputStateOptions = {
  fileName: string;
  inputAuthPayload?: ServiceQuestionsResult;
  category: string;
  resourceName: string;
};
export declare class AuthInputState {
  static authInputState: AuthInputState;
  _filePath: string;
  _resourceName: string;
  _category: string;
  _authInputPayload: ServiceQuestionsResult | undefined;
  constructor(props: AuthInputStateOptions);
  static getInstance(props: AuthInputStateOptions): AuthInputState;
  getCliInputPayload(): ServiceQuestionsResult;
  saveCliInputPayload(): void;
}
//# sourceMappingURL=auth-input-state.d.ts.map
