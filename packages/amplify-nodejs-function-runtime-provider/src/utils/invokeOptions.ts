export type InvokeOptions = {
  packageFolder: string;
  handler: string;
  event: string;
  context?: object;
  environment?: { [key: string]: string };
};
