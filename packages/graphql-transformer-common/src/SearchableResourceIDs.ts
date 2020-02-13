import { ES_SCALARS } from './definition';

export class SearchableResourceIDs {
  static SearchableEventSourceMappingID(typeName: string): string {
    return `Searchable${typeName}LambdaMapping`;
  }
  static SearchableFilterInputTypeName(name: string): string {
    const nameOverride = ES_SCALARS[name];
    if (nameOverride) {
      return `Searchable${nameOverride}FilterInput`;
    }
    return `Searchable${name}FilterInput`;
  }
}
