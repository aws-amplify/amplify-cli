import { $TSContext, ServiceSelection } from '@aws-amplify/amplify-cli-core';
import { importS3 } from './import-s3';
import { importDynamoDB } from './import-dynamodb';

export const importResource = async (context: $TSContext, categoryName: string, serviceSelection: ServiceSelection) => {
  if (serviceSelection.service === 'S3') {
    await importS3(context, serviceSelection, undefined);
  } else if (serviceSelection.service === 'DynamoDB') {
    await importDynamoDB(context, serviceSelection, undefined);
  } else {
    throw new Error(`Unsupported service for import: ${serviceSelection.service}`);
  }
};
