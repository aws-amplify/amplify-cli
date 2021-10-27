import {
  AddApiRequest,
  AddAuthRequest,
  AddStorageRequest,
  ImportAuthRequest,
  ImportStorageRequest,
  RemoveStorageRequest,
  UpdateApiRequest,
  UpdateAuthRequest,
  UpdateStorageRequest,
  AddGeoRequest,
  UpdateGeoRequest
} from 'amplify-headless-interface';
import { HeadlessInputValidator } from './HeadlessInputValidator';
import {
  addApiRequestSchemaSupplier,
  addAuthRequestSchemaSupplier,
  addStorageRequestSchemaSupplier,
  importAuthRequestSchemaSupplier,
  importStorageRequestSchemaSupplier,
  removeStorageRequestSchemaSupplier,
  updateApiRequestSchemaSupplier,
  updateAuthRequestSchemaSupplier,
  updateStorageRequestSchemaSupplier,
  addGeoRequestSchemaSupplier,
  updateGeoRequestSchemaSupplier
} from './schemaSuppliers';
import { noopUpgradePipeline } from './upgradePipelines';

/* API */
export const validateAddApiRequest = (raw: string) => {
  return new HeadlessInputValidator(addApiRequestSchemaSupplier, noopUpgradePipeline).validate<AddApiRequest>(raw);
};

export const validateUpdateApiRequest = (raw: string) => {
  return new HeadlessInputValidator(updateApiRequestSchemaSupplier, noopUpgradePipeline).validate<UpdateApiRequest>(raw);
};

/* Auth */
export const validateAddAuthRequest = (raw: string) => {
  return new HeadlessInputValidator(addAuthRequestSchemaSupplier, noopUpgradePipeline).validate<AddAuthRequest>(raw);
};

export const validateUpdateAuthRequest = (raw: string) => {
  return new HeadlessInputValidator(updateAuthRequestSchemaSupplier, noopUpgradePipeline).validate<UpdateAuthRequest>(raw);
};

export const validateImportAuthRequest = (raw: string) => {
  return new HeadlessInputValidator(importAuthRequestSchemaSupplier, noopUpgradePipeline).validate<ImportAuthRequest>(raw);
};

/* Storage */
export const validateAddStorageRequest = (raw: string) => {
  return new HeadlessInputValidator(addStorageRequestSchemaSupplier, noopUpgradePipeline).validate<AddStorageRequest>(raw);
};

export const validateImportStorageRequest = (raw: string) => {
  return new HeadlessInputValidator(importStorageRequestSchemaSupplier, noopUpgradePipeline).validate<ImportStorageRequest>(raw);
};

export const validateRemoveStorageRequest = (raw: string) => {
  return new HeadlessInputValidator(removeStorageRequestSchemaSupplier, noopUpgradePipeline).validate<RemoveStorageRequest>(raw);
};

export const validateUpdateStorageRequest = (raw: string) => {
  return new HeadlessInputValidator(updateStorageRequestSchemaSupplier, noopUpgradePipeline).validate<UpdateStorageRequest>(raw);
};

//Geo category
export const validateAddGeoRequest = (raw: string) => {
  return new HeadlessInputValidator(addGeoRequestSchemaSupplier, noopUpgradePipeline).validate<AddGeoRequest>(raw);
};

export const validateUpdateGeoRequest = (raw: string) => {
  return new HeadlessInputValidator(updateGeoRequestSchemaSupplier, noopUpgradePipeline).validate<UpdateGeoRequest>(raw);
};
