import { HeadlessInputValidator } from './HeadlessInputValidator';
import { addStorageRequestSchemaSupplier, addApiRequestSchemaSupplier, addAuthRequestSchemaSupplier } from './schemaSuppliers';
import { noopUpgradePipeline } from './upgradePipelines';
import { AddStorageRequest, AddApiRequest, AddAuthRequest } from 'amplify-headless-interface';

export const validateAddStorageRequest = (raw: string) => {
  return new HeadlessInputValidator(addStorageRequestSchemaSupplier, noopUpgradePipeline).validate<AddStorageRequest>(raw);
};

export const validateAddApiRequest = (raw: string) => {
  return new HeadlessInputValidator(addApiRequestSchemaSupplier, noopUpgradePipeline).validate<AddApiRequest>(raw);
};

export const validateAddAuthRequest = (raw: string) => {
  return new HeadlessInputValidator(addAuthRequestSchemaSupplier, noopUpgradePipeline).validate<AddAuthRequest>(raw);
};
