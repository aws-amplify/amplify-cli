export type AmplifyProjectInfo = {
  envName: string;
  projectName: string;
};

export type AmplifyVmSandboxEnv = {
  _BUILD_TIMEOUT?: string;
  _LIVE_UPDATES?: string;
  AMPLIFY_AMAZON_CLIENT_ID?: string;
  AMPLIFY_BACKEND_APP_ID?: string;
  AMPLIFY_BACKEND_PULL_ONLY?: string;
  AMPLIFY_DIFF_BACKEND?: string;
  AMPLIFY_DIFF_DEPLOY?: string;
  AMPLIFY_DIFF_DEPLOY_ROOT?: string;
  AMPLIFY_FACEBOOK_CLIENT_ID?: string;
  AMPLIFY_GOOGLE_CLIENT_ID?: string;
  AMPLIFY_IDENTITYPOOL_ID?: string;
  AMPLIFY_MONOREPO_APP_ROOT?: string;
  AMPLIFY_NATIVECLIENT_ID?: string;
  AMPLIFY_SKIP_BACKEND_BUILD?: string;
  AMPLIFY_USERPOOL_ID?: string;
  AMPLIFY_WEBCLIENT_ID?: string;
  AWS_APP_ID?: string;
  AWS_BRANCH?: string;
  AWS_BRANCH_ARN?: string;
  AWS_CLONE_URL?: string;
  AWS_COMMIT_ID?: string;
  AWS_JOB_ID?: string;
  [key: string]: string | undefined;
}

export type AmplifyVmSandbox = {
  env: AmplifyVmSandboxEnv,
  projectInfo: AmplifyProjectInfo
}

export type VmSandbox = {
  amplify: AmplifyVmSandbox
}
