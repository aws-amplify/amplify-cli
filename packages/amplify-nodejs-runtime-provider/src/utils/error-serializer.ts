const createMap = (error: any) =>
  Object.getOwnPropertyNames(error).reduce((obj: any, property) => {
    obj[property] = error[property];
    return obj;
  }, {});

export const serializer = (error: any) => JSON.stringify(createMap(error));
