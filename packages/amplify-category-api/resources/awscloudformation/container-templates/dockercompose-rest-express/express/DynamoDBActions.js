const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();

const TableName = process.env.STORAGE_POSTS_NAME;

const addPostToDDB = async ({ id, title, author, description, topic }) => {

  var params = {
    Item: {
      id: parseInt(id, 10),
      title: title,
      author: author,
      description: description,
      topic: topic
    },
    TableName: TableName
  }
  try {
    const data = await docClient.put(params).promise()
    return params.Item;
  } catch (err) {
    console.log('Error: ' + err);
    return err
  }
}

const scanPostsFromDDB = async () => {
  var params = {
    TableName: TableName,
  }

  try {
    const data = await docClient.scan(params).promise();
    return data.Items;
  } catch (err) {
    console.log('Error: ' + err);
    return err;
  }
}

const getPostFromDDB = async (id) => {
  const key = parseInt(id, 10);
  var params = {
    TableName: TableName,
    Key: { id: key },
  }
  try {
    const data = await docClient.get(params).promise()
    return data.Item;
  } catch (err) {
    console.log('Error: ' + err);
    return err
  }
}

module.exports = {
  addPostToDDB,
  scanPostsFromDDB,
  getPostFromDDB
};