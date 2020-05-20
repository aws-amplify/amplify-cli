import {HeadlessInputValidator} from 'amplify-util-headless-input';
import { VersionedSchemaSupplier, VersionUpgradePipeline } from 'amplify-util-headless-input/src/HeadlessInputValidator';
import path from 'path';
import { AddStorage } from '../../headless-interface/v1';

const schemaRoot = path.normalize(path.join(__dirname, '../../../schemas'));

export const handleAddStorageHeadlessRequest = async (context: any) => {
  const validator = new HeadlessInputValidator(getVersionedSchemaSupplier(context), versionUpgradePipeline);
  const headlessRequest: AddStorage = validator.validate<AddStorage>(await context.amplify.getHeadlessInput())
  // execute the request
  console.log(headlessRequest);
  return;
}

const getVersionedSchemaSupplier = (context: any): VersionedSchemaSupplier => {
  return version => {
    switch (version) {
      case 1:
        return {
          rootSchema: context.amplify.readJsonFile(path.join(schemaRoot, 'v1', 'addStorage.schema.json'))
        }
    }
  }
}

// for now this is empty, but when we have multiple versions it can be updated to be a sequence of functions to perform the upgrades
const versionUpgradePipeline: VersionUpgradePipeline = () => []