import { $TSContext } from 'amplify-cli-core';
import { AddStorageRequest, CrudOperation, UpdateStorageRequest } from 'amplify-headless-interface';
import { S3UserInputs } from '../..';
import { S3PermissionType, S3UserInputTriggerFunctionParams } from './service-walkthrough-types/s3-user-input-types';
export declare function buildS3UserInputFromHeadlessStorageRequest(context: $TSContext, storageRequest: AddStorageRequest): S3UserInputs;
export declare function buildS3UserInputFromHeadlessUpdateStorageRequest(context: $TSContext, storageRequest: UpdateStorageRequest): Promise<S3UserInputs>;
export declare function buildTriggerFunctionParams(triggerFunctionName: string): S3UserInputTriggerFunctionParams;
export declare function getS3PermissionFromHeadlessParams(headlessPermissionList: CrudOperation[] | undefined): S3PermissionType[];
//# sourceMappingURL=s3-headless-adapter.d.ts.map