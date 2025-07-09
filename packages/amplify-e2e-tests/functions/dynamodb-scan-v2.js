const AWS = require('aws-sdk');
const DDB = new AWS.DynamoDB();

exports.handler = async (event) => {
  return await DDB.scan({ TableName: event.tableName }).promise();
};
