export type LocalProjectData = {};
export type LogPayload = {
  module: string;
  args: Array<any>;
};

export type LogErrorPayload = LogPayload & {
  error: Error;
};
