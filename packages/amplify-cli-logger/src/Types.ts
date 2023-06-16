export type LogPayload = {
  message: string;
};

export type LogErrorPayload = LogPayload & {
  error: Error;
};
