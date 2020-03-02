const createMap = error =>
  Object.getOwnPropertyNames(error).reduce((obj, property) => {
    obj[property] = error[property];
    return obj;
  }, {});

export const serializer = error => JSON.stringify(createMap(error));
