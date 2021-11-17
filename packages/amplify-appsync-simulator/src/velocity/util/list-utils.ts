import { identity, isObject, negate, orderBy, some } from 'lodash';
import { JavaArray } from '../value-mapper/array';
import { map as valueMap } from '../value-mapper/mapper';

export const listUtils = {
  copyAndRetainAll(list: any[], intersect: any[]) {
    if (list instanceof JavaArray && intersect instanceof JavaArray) {
      return valueMap(list.toJSON().filter(value => intersect.toJSON().includes(value)));
    } else {
      return list.filter(value => intersect.indexOf(value) !== -1);
    }
  },
  copyAndRemoveAll(list: any[], toRemove: any[]) {
    if (list instanceof JavaArray && toRemove instanceof JavaArray) {
      // we convert back to js array to filter and then re-create as java array when filtering is done
      // this is avoid using filtering within the java array is that can create a '0' entry
      return valueMap(list.toJSON().filter(value => !toRemove.toJSON().includes(value)));
    } else {
      return list.filter(value => toRemove.indexOf(value) === -1);
    }
  },
  sortList(list: any[], desc: boolean, property: string) {
    if (list.length === 0 || list.length > 1000) {
      return list;
    }

    const type = typeof list[0];
    const isMixedTypes = some(list.slice(1), i => typeof i !== type);

    if (isMixedTypes) {
      return list;
    }

    const isScalarList = some(list, negate(isObject));

    return orderBy(list, isScalarList ? identity : property, desc ? 'desc' : 'asc');
  },
};
