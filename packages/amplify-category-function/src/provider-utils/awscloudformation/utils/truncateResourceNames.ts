import { v5 as uuid } from 'uuid';

const funcNameMaxLen = 64; // max length allowed by Lambda service
const roleNameMaxLen = 64; // max length allowed by IAM service

type Params = {
  functionName?: string;
  roleName?: string;
};

export const truncateResourceNames = (params: Readonly<Params>): Params => {
  const result: Params = {};
  if (typeof params.functionName === 'string') {
    result.functionName = ResourceNameTruncator.withLimit(funcNameMaxLen).truncate(params.functionName);
  }

  if (typeof params.roleName === 'string') {
    result.roleName = ResourceNameTruncator.withLimit(roleNameMaxLen).truncate(params.roleName);
  }
  return result;
};

class ResourceNameTruncator {
  // this is an arbitrary uuid that is used as a seed to generate deterministic hashes from a given resource name
  // eslint-disable-next-line spellcheck/spell-checker
  private readonly uuidSeed = '319569b2-7cdc-4712-8390-e22b1f6ce5a9';
  private readonly envNameLen = 10;
  private readonly hashLen = 12;
  private readonly effectiveResourceNameLengthLimit: number;
  private readonly resourceNameSlicePoint: number;

  private constructor(resourceNameLengthLimit: number) {
    this.effectiveResourceNameLengthLimit = resourceNameLengthLimit - this.envNameLen;
    this.resourceNameSlicePoint = this.effectiveResourceNameLengthLimit - this.hashLen;
  }

  static withLimit(resourceNameLengthLimit: number) {
    return new ResourceNameTruncator(resourceNameLengthLimit);
  }

  truncate(resourceName: string): string {
    if (resourceName.length < this.effectiveResourceNameLengthLimit) {
      return resourceName;
    }
    // grabbing a substring from the beginning and end of the input name will hopefully capture any human-readable prefixes or suffixes that the customer has used in the name
    const prefix = resourceName.slice(0, this.resourceNameSlicePoint / 2);
    const suffix = resourceName.slice(resourceName.length - this.resourceNameSlicePoint / 2);
    const middle = resourceName.slice(this.resourceNameSlicePoint / 2, resourceName.length - this.resourceNameSlicePoint / 2);
    const hash = uuid(middle, this.uuidSeed);
    const shortHash = hash.slice(hash.length - this.hashLen);
    return `${prefix}${suffix}${shortHash}`;
  }
}
