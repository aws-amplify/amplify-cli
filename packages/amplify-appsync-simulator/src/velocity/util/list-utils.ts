import { identity, isObject, negate, orderBy, some } from 'lodash';

export const listUtils = {
  copyAndRetainAll(list: any[], intersect: any[]) {
    return list.filter(value => intersect.indexOf(value) !== -1);
  },
  copyAndRemoveAll(list: any[], toRemove: any[]) {
    return list.filter(value => toRemove.indexOf(value) === -1);
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
