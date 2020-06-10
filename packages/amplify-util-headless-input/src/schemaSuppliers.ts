import { VersionedSchemaSupplier } from './HeadlessInputValidator';

export const addStorageRequestSchemaSupplier: VersionedSchemaSupplier = version => {
  return getSchema('AddStorageRequest', version);
};

export const addAuthRequestSchemaSupplier: VersionedSchemaSupplier = version => {
  return getSchema('AddAuthRequest', version);
};

export const addApiRequestSchemaSupplier: VersionedSchemaSupplier = version => {
  return getSchema('AddApiRequest', version);
};

const getSchema = async (type: string, version: number) => {
  try {
    return {
      rootSchema: await import(`amplify-headless-interface/schemas/${version}/${type}.schema.json`),
    };
  } catch (ex) {
    return; // resolve the promise with void if the schema does not exist
  }
};
