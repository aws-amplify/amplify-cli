import { DynamoDB } from 'aws-sdk';

const MILLI_SECONDS = 1000;
export async function waitTillTableStateIsActive(
  dynamoDBClient: DynamoDB,
  tableName: string,
  maximumWait: number = 15 * MILLI_SECONDS,
): Promise<void> {
  return new Promise((resolve, reject) => {
    let intervalHandle;
    let timeoutHandle;
    const checkStatus = async () => {
      const tableDescription = await dynamoDBClient.describeTable({ TableName: tableName }).promise();
      if (tableDescription.Table.TableStatus === 'ACTIVE') {
        clearTimeout(timeoutHandle);
        clearInterval(intervalHandle);
        resolve();
      }
    };
    intervalHandle = setInterval(checkStatus, 1000);
    timeoutHandle = setTimeout(() => {
      clearTimeout(timeoutHandle);
      clearInterval(intervalHandle);
      reject(new Error('Waiting for table status to turn ACTIVE timed out'));
    }, maximumWait);

    checkStatus();
  });
}
