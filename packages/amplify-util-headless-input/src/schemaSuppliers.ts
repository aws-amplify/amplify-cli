import { VersionedSchemaSupplier } from './HeadlessInputValidator';

export const addStorageRequestSchemaSupplier: VersionedSchemaSupplier = version => {
  return getSchema('AddStorageRequest', 'storage', version);
};

export const addAuthRequestSchemaSupplier: VersionedSchemaSupplier = version => {
  return getSchema('AddAuthRequest', 'auth', version);
};

export const updateAuthRequestSchemaSupplier: VersionedSchemaSupplier = version => {
  return getSchema('UpdateAuthRequest', 'auth', version);
};

export const importAuthRequestSchemaSupplier: VersionedSchemaSupplier = version => {
  return getSchema('ImportAuthRequest', 'auth', version);
};

export const addApiRequestSchemaSupplier: VersionedSchemaSupplier = version => {
  return getSchema('AddApiRequest', 'api', version);
};

export const updateApiRequestSchemaSupplier: VersionedSchemaSupplier = version => {
  return getSchema('UpdateApiRequest', 'api', version);
};

const getSchema = async (type: string, category: string, version: number) => {
  try {
    return {
      rootSchema: await import(`amplify-headless-interface/schemas/${category}/${version}/${type}.schema.json`),
    };
  } catch (ex) {
    return; // resolve the promise with void if the schema does not exist
  }
};
