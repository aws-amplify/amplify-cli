export const listUtils = {
  copyAndRetainAll(list: any[], intersect: any[]) {
    return list.filter(value => intersect.indexOf(value) !== -1);
  },
  copyAndRemoveAll(list: any[], toRemove: any[]) {
    return list.filter(value => toRemove.indexOf(value) === -1);
  },
};
