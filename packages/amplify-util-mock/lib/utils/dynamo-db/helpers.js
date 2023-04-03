"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitTillTableStateIsActive = void 0;
const MILLI_SECONDS = 1000;
async function waitTillTableStateIsActive(dynamoDBClient, tableName, maximumWait = 15 * MILLI_SECONDS) {
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
        intervalHandle = setInterval(void checkStatus, 1000);
        timeoutHandle = setTimeout(() => {
            clearTimeout(timeoutHandle);
            clearInterval(intervalHandle);
            reject(new Error('Waiting for table status to turn ACTIVE timed out'));
        }, maximumWait);
        void checkStatus();
    });
}
exports.waitTillTableStateIsActive = waitTillTableStateIsActive;
//# sourceMappingURL=helpers.js.map