// export interface TriggerModules {
//     "verification-link": VerificationLink;
//     "add-to-group": AddToGroup;
//     "captcha-verify":  CAPTCHAVerify;
//     "boilerplate-verify": BoilerplateVerify;
//     "alter-claims": AlterClaims;
//     "email-filter-allowlist": EmailFilterList;
//     "email-filter-denylist":  EmailFilterList;
//     "captcha-define-challenge":     DefineChallenge;
//     "boilerplate-define-challenge": DefineChallenge;
// }

export type TriggerModules = Record<string, AuthModuleType>;

export type AuthModuleType =
  | VerificationLink
  | AddToGroup
  | CAPTCHAVerify
  | BoilerplateVerify
  | AlterClaims
  | EmailFilterList
  | DefineChallenge;

export interface DefineChallenge {
  name: string;
  description: string;
}

export interface EmailFilterList {
  name: string;
  description: string;
  env: Env[];
}

export interface AlterClaims {
  name: string;
  description: string;
}

export interface AddToGroup {
  name: string;
  description: string;
  permissions: Permission[];
  env: Env[];
}

export interface VerificationLink {
  name: string;
  description: string;
  env: Env[];
}

export interface BoilerplateVerify {
  name: string;
  description: string;
}

export interface CAPTCHAVerify {
  name: string;
  description: string;
  env: Env[];
}

export interface Env {
  key: string;
  value: string;
  question?: Question;
  private?: true;
}

export interface Question {
  name: string;
  type: string;
  message: string;
}

export interface Permission {
  policyName: string;
  trigger: string;
  effect: string;
  actions: string[];
  resource: Resource;
}

export interface Resource {
  paramType: string;
  keys: string[];
}

export interface CognitoTriggerMaps {
  CreateAuthChallenge: ModuleMetadata;
  CustomMessage: ModuleMetadata;
  DefineAuthChallenge: ModuleMetadata;
  PostAuthentication: ModuleMetadata;
  PostConfirmation: ModuleMetadata;
  PreAuthentication: ModuleMetadata;
  PreSignup: ModuleMetadata;
  VerifyAuthChallengeResponse: ModuleMetadata;
  PreTokenGeneration: ModuleMetadata;
  URL: string;
}

export interface ModuleMetadata {
  name: string;
}
