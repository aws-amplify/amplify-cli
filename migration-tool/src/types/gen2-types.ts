export interface DefineCustom {
  name: string;
  stack: string;
}

export interface Gen2Exports {
  [key: string]: {
    value: string;
    description?: string;
  };
}

export interface Gen2EnvRef {
  original: string;
  gen2Pattern: string;
}

export interface Gen2ResourceRef {
  original: string;
  gen2Import: string;
  reference: string;
}

export type Gen2ResourceRefs = Gen2ResourceRef[];
