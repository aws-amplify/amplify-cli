import { FieldMapEntry, ModelFieldMap, ResolverReferenceEntry } from '@aws-amplify/graphql-transformer-interfaces';
import _ from 'lodash';

export class ModelFieldMapImpl implements ModelFieldMap {
  readonly #fieldMapping: FieldMapEntry[] = [];
  readonly #resolverReferences: ResolverReferenceEntry[] = [];

  addMappedField = (entry: FieldMapEntry) => {
    if (!this.#fieldMapping.find(fieldMapEqualsPredicate(entry))) {
      this.#fieldMapping.push(entry);
    }
    return this;
  };

  addResolverReference = (entry: ResolverReferenceEntry) => {
    const existingEntry = this.#resolverReferences.find(resolverReferenceEqualsPredicate(entry));
    if (!existingEntry) {
      this.#resolverReferences.push(entry);
    } else {
      if (existingEntry.isList !== entry.isList) {
        throw new Error(
          `Resolver of type [${existingEntry.typeName}] and field [${existingEntry.fieldName}] already registered with isList set to [${existingEntry.isList}]`,
        );
      }
    }
    return this;
  };

  getMappedFields = (): Readonly<Array<Readonly<FieldMapEntry>>> => _.cloneDeep(this.#fieldMapping);

  getResolverReferences = (): Readonly<Array<Readonly<ResolverReferenceEntry>>> => _.cloneDeep(this.#resolverReferences);
}

const fieldMapEqualsPredicate = (compareTo: FieldMapEntry) => (entry: FieldMapEntry) =>
  compareTo.currentFieldName === entry.currentFieldName && compareTo.originalFieldName === entry.originalFieldName;

// not that this predicate does NOT compare the isList property of the ResolverReferenceEntry
// that is handled separately in the addResolverReference method above
const resolverReferenceEqualsPredicate = (compareTo: ResolverReferenceEntry) => (entry: ResolverReferenceEntry) =>
  compareTo.typeName === entry.typeName && compareTo.fieldName === entry.fieldName;
