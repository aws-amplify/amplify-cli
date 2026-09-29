import { ResourceType } from './ResourceType';

export type BuiltParams = {
  zipFilename: string;
  zipFilePath: string;
};

export type BuiltResourceType = ResourceType & {
  buildParams?: BuiltParams[];
};
