import _ from 'lodash';

export const recursiveOmit = (obj: any, path: Array<string>): void => {
  if (path.length === 0) return;
  const currentKey = path[0];
  if (path.length === 1 && !!obj[currentKey]) {
    delete obj[currentKey];
    return;
  }

  if (!obj[currentKey]) {
    return;
  }

  recursiveOmit(obj[currentKey], path.slice(1));

  if (obj[currentKey] && _.isEmpty(obj[currentKey])) {
    delete obj[currentKey];
  }
};
