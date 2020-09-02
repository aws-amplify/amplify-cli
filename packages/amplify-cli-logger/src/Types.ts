export type LocalProjectData = {};
export type LogPayload = {
  module: string;
  args: Array<any>;
  isStackEvent: boolean;
};

export type LogErrorPayload = LogPayload & {
  error: Error;
};
