export * from './default-editor';
export * from './env-name';
export * from './frontend-handler';
export * from './project-name';
export * from './providers';

export type BasePrompt = {
  // required
  type: string;
  name: string;
  message: string;

  // optional
  skip?: boolean;
  initial?: string;
  format?: Function;
  result?: Function;
  validate?: Function;
};

export type BaseInitPromptResults = {
  inputProjectName: string;
  inputEnvName: string;
  editorSelected: string;
  frontendSelected: string;
  providerSelected: string[];
};
