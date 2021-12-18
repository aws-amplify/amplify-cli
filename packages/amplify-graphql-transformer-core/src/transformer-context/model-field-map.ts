import { FieldMapEntry, ModelFieldMap, ResolverReferenceEntry } from '@aws-amplify/graphql-transformer-interfaces';
import _ from 'lodash';

export class ModelFieldMapImpl implements ModelFieldMap {
  readonly #fieldMapping: FieldMapEntry[] = [];
  readonly #resolverReferences: ResolverReferenceEntry[] = [];

  addMappedField = (entry: FieldMapEntry) => {
    this.#fieldMapping.push(entry);
    return this;
  };

  addResolverReference = (entry: ResolverReferenceEntry) => {
    this.#resolverReferences.push(entry);
    return this;
  };

  getMappedFields = (): Readonly<Array<Readonly<FieldMapEntry>>> => _.cloneDeep(this.#fieldMapping);

  getResolverReferences = (): Readonly<Array<Readonly<ResolverReferenceEntry>>> => _.cloneDeep(this.#resolverReferences);
}
